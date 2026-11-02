"use client";

import { useMemo, useState } from "react";
import { orderBy } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, CheckCircle2, Clock, Gauge, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { createDoc, updateDocById, deleteDocById } from "@/lib/firestore-service";
import { orderSchema } from "@/lib/schemas";
import { computeQueueSchedule } from "@/lib/production-helpers";
import { formatCurrency, formatMinutes, formatDateTime, detectShift } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function OrdersPage() {
  const { settings } = useSettings();
  const { data: machines } = useCollection("machines", [orderBy("name")]);
  const { data: products } = useCollection("products", [orderBy("name")]);
  const { data: orders, loading: ordersLoading } = useCollection("orders", [orderBy("sequence", "asc")]);
  const { data: logs } = useCollection("production_logs", [orderBy("created_at", "desc")]);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const machinesById = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: { machine_id: "", product_id: "", target_quantity: 100, rate_per_minute: 1 },
  });

  const selectedProductId = watch("product_id");

  function onProductChange(productId) {
    setValue("product_id", productId);
    const product = productsById.get(productId);
    if (product) setValue("rate_per_minute", product.rate_per_minute);
  }

  async function onSubmit(values) {
    try {
      const existingForMachine = orders.filter((o) => o.machine_id === values.machine_id && o.status !== "completed");
      const nextSequence = existingForMachine.length
        ? Math.max(...existingForMachine.map((o) => o.sequence || 0)) + 1
        : 1;
      await createDoc("orders", {
        machine_id: values.machine_id,
        product_id: values.product_id,
        target_quantity: Number(values.target_quantity),
        rate_per_minute: Number(values.rate_per_minute),
        sequence: nextSequence,
        status: existingForMachine.length === 0 ? "active" : "queued",
        created_at: Date.now(),
      });
      toast.success(existingForMachine.length === 0 ? "Order added and set active" : "Order added to the queue");
      reset({ machine_id: "", product_id: "", target_quantity: 100, rate_per_minute: 1 });
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Could not save the order");
    }
  }

  async function handleComplete(order) {
    try {
      await updateDocById("orders", order.id, { status: "completed", completed_at: Date.now() });
      toast.success("Order marked complete — next in queue is now active");
    } catch (err) {
      toast.error(err.message || "Could not update the order");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDocById("orders", deleting.id);
      toast.success("Order removed");
      setDeleting(null);
    } catch (err) {
      toast.error(err.message || "Failed to remove order");
    } finally {
      setBusy(false);
    }
  }

  // Group into a per-machine queue, each with a computed ETA schedule.
  const machineGroups = machines.map((machine) => {
    const machineOrders = orders.filter((o) => o.machine_id === machine.id);
    const schedule = computeQueueSchedule(machineOrders, productsById, logs);
    return { machine, schedule };
  }).filter((g) => g.schedule.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Orders</h1>
          <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">
            Target quantities per machine, with an estimated finish time — a suggestion, not a guarantee.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Add Order</Button>
      </div>

      {!ordersLoading && machineGroups.length === 0 && (
        <Card><CardBody className="text-center text-sm text-steel-400 py-10">No orders yet. Add one to start tracking a target.</CardBody></Card>
      )}

      <div className="space-y-4">
        {machineGroups.map(({ machine, schedule }) => (
          <Card key={machine.id}>
            <CardHeader>
              <CardTitle>{machine.name}</CardTitle>
              <span className="text-xs text-steel-400">{schedule.length} order{schedule.length !== 1 ? "s" : ""} queued</span>
            </CardHeader>
            <CardBody className="space-y-3">
              {schedule.map(({ order, product, produced, remaining, rate, rateSource, minutesNeeded, estStart, estFinish, isActive }) => {
                const progressPct = order.target_quantity > 0 ? Math.min(100, (produced / order.target_quantity) * 100) : 0;
                const finishShift = estFinish ? detectShift(settings.day_shift_start, settings.night_shift_start, estFinish) : null;
                return (
                  <div key={order.id} className={`rounded-lg border p-4 ${isActive ? "border-instrument-500/30 bg-instrument-500/5" : "border-steel-100 dark:border-steel-700"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isActive ? <Gauge className="h-4 w-4 text-instrument-600" /> : <Clock className="h-4 w-4 text-steel-400" />}
                        <span className="font-semibold text-steel-800 dark:text-steel-100">{product?.name ?? "Unknown product"}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? "bg-instrument-600 text-white" : "bg-steel-200 text-steel-600 dark:bg-steel-700 dark:text-steel-300"}`}>
                          {isActive ? "Active" : "Queued"}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {isActive && (
                          <Button variant="secondary" size="sm" onClick={() => handleComplete(order)}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Mark Complete
                          </Button>
                        )}
                        <button onClick={() => setDeleting(order)} className="rounded-md p-1.5 text-steel-400 hover:bg-danger/10 hover:text-danger" aria-label="Delete order">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-steel-100 dark:bg-steel-700">
                      <div className="h-full rounded-full bg-gauge-400" style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-xs text-steel-500 dark:text-steel-400">
                      <span className="font-mono">{produced.toLocaleString()} / {order.target_quantity.toLocaleString()} pcs</span>
                      <span>{progressPct.toFixed(0)}%</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-steel-400">Remaining</p>
                        <p className="font-mono font-semibold">{remaining.toLocaleString()} pcs</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-steel-400">Pace Used</p>
                        <p className="font-mono font-semibold">
                          {rate.toFixed(1)}/min
                          <span className="ml-1 text-[10px] font-sans font-normal text-steel-400">
                            ({rateSource === "observed" ? "actual today" : "rated"})
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-steel-400">Est. Time Left</p>
                        <p className="font-mono font-semibold">{formatMinutes(minutesNeeded)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-steel-400">Est. Finish</p>
                        <p className="font-mono font-semibold">
                          {estFinish ? formatDateTime(estFinish) : "—"}
                          {finishShift && <span className="ml-1 text-[10px] font-sans font-normal capitalize text-steel-400">({finishShift})</span>}
                        </p>
                      </div>
                    </div>
                    {!isActive && (
                      <p className="mt-2 text-[11px] text-steel-400">
                        Estimated to start around {formatDateTime(estStart)}, once the order ahead of it finishes.
                      </p>
                    )}
                  </div>
                );
              })}
            </CardBody>
          </Card>
        ))}
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-steel-100 px-4 py-3 text-xs text-steel-500 dark:bg-steel-800 dark:text-steel-400">
        <ArrowUpDown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Estimates use today's actual counted pace where there's enough data, otherwise the product's rated pieces/minute. Power cuts, machine stops, and staffing gaps aren't accounted for — treat these as a planning guide, not a promise.
      </p>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Order" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Machine</Label>
            <Select {...register("machine_id")} error={errors.machine_id?.message}>
              <option value="">Select machine</option>
              {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Product</Label>
            <Select value={selectedProductId} onChange={(e) => onProductChange(e.target.value)} error={errors.product_id?.message}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Target Quantity (pieces)</Label>
            <Input type="number" min={1} {...register("target_quantity")} error={errors.target_quantity?.message} />
          </div>
          <div>
            <Label>Rate (pieces / minute)</Label>
            <Input type="number" min={0.1} step="0.1" {...register("rate_per_minute")} error={errors.rate_per_minute?.message} />
            <p className="mt-1 text-xs text-steel-400">Auto-filled from the product's rated speed — adjust if this machine runs faster or slower.</p>
          </div>
          <p className="text-xs text-steel-400">
            If this machine already has an active order, the new one joins the queue behind it and runs next.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>Add Order</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove Order?" size="sm">
        <p className="text-sm text-steel-500 dark:text-steel-400">
          This removes the order and its position in the queue. Production already counted stays in the logs.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
