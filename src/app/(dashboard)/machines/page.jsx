"use client";
import { useState } from "react";
import { orderBy } from "firebase/firestore";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, ArrowRight, Cog } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/hooks/useCollection";
import { createDoc, updateDocById, deleteDocById } from "@/lib/firestore-service";
import { machineSchema } from "@/lib/schemas";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/Skeleton";
function MachinesPage() {
  const { data: machines, loading } = useCollection("machines", [orderBy("name")]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(machineSchema),
    defaultValues: { name: "", status: "running" }
  });
  function openCreate() {
    setEditingMachine(null);
    reset({ name: "", status: "running" });
    setModalOpen(true);
  }
  function openEdit(m) {
    setEditingMachine(m);
    reset({ name: m.name, status: m.status });
    setModalOpen(true);
  }
  async function onSubmit(values) {
    try {
      if (editingMachine) {
        await updateDocById("machines", editingMachine.id, values);
        toast.success("Machine updated");
      } else {
        await createDoc("machines", { ...values, created_at: Date.now() });
        toast.success("Machine added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Could not save machine");
    }
  }
  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDocById("machines", deleting.id);
      toast.success("Machine removed");
      setDeleting(null);
    } catch {
      toast.error("Failed to remove machine");
    } finally {
      setBusy(false);
    }
  }
  const statusStyles = {
    running: "bg-ok/10 text-ok",
    idle: "bg-steel-200 text-steel-600 dark:bg-steel-700 dark:text-steel-300",
    maintenance: "bg-danger/10 text-danger"
  };
  return <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Machines</h1>
          <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">{machines.length} of 3 machines registered</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Machine</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && machines.map((m) => <Card key={m.id}>
            <CardBody>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-instrument-600/10 text-instrument-600">
                    <Cog className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-steel-800 dark:text-steel-50">{m.name}</p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[m.status]}`}>{m.status}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="rounded-md p-1.5 text-steel-400 hover:bg-steel-100 hover:text-instrument-600 dark:hover:bg-steel-700" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(m)} className="rounded-md p-1.5 text-steel-400 hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Link href={`/machines/${m.id}`} className="mt-4 flex items-center gap-1 text-sm font-medium text-instrument-600 hover:underline dark:text-gauge-300">
                View performance <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardBody>
          </Card>)}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingMachine ? "Edit Machine" : "Add Machine"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Machine Name</Label>
            <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Machine 1" />
          </div>
          <div>
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="running">Running</option>
              <option value="idle">Idle</option>
              <option value="maintenance">Maintenance</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingMachine ? "Save Changes" : "Add Machine"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove Machine?" size="sm">
        <p className="text-sm text-steel-500 dark:text-steel-400">
          {deleting?.name} will be removed. Past production logs referencing it are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>;
}
export {
  MachinesPage as default
};
