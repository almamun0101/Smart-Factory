"use client";
import { useState } from "react";
import { orderBy } from "firebase/firestore";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/hooks/useCollection";
import { createDoc, updateDocById, deleteDocById } from "@/lib/firestore-service";
import { workerSchema } from "@/lib/schemas";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRow } from "@/components/ui/Skeleton";
function WorkersPage() {
  const { data: workers, loading } = useCollection("workers", [orderBy("name")]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(workerSchema),
    defaultValues: { name: "", employee_id: "", phone: "", status: "active" }
  });
  function openCreate() {
    setEditingWorker(null);
    reset({ name: "", employee_id: "", phone: "", status: "active" });
    setModalOpen(true);
  }
  function openEdit(w) {
    setEditingWorker(w);
    reset({ name: w.name, employee_id: w.employee_id, phone: w.phone, status: w.status });
    setModalOpen(true);
  }
  async function onSubmit(values) {
    try {
      if (editingWorker) {
        await updateDocById("workers", editingWorker.id, values);
        toast.success("Worker updated");
      } else {
        await createDoc("workers", { ...values, created_at: Date.now() });
        toast.success("Worker added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Could not save worker");
    }
  }
  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDocById("workers", deleting.id);
      toast.success("Worker removed");
      setDeleting(null);
    } catch {
      toast.error("Failed to remove worker");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Workers</h1>
          <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">{workers.length} of 12 workers registered</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Worker</Button>
      </div>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400 dark:bg-steel-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={5} />)}
              {!loading && workers.map((w) => <tr key={w.id} className="border-t border-steel-100 dark:border-steel-700">
                  <td className="px-4 py-3 font-medium text-steel-700 dark:text-steel-200">{w.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{w.employee_id}</td>
                  <td className="px-4 py-3">{w.phone}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (w.status === "active" ? "bg-ok/10 text-ok" : "bg-steel-200 text-steel-600 dark:bg-steel-700")}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/workers/${w.id}`} className="rounded-md p-1.5 text-steel-400 hover:bg-steel-100 hover:text-instrument-600 dark:hover:bg-steel-700" aria-label="Open profile">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <button onClick={() => openEdit(w)} className="rounded-md p-1.5 text-steel-400 hover:bg-steel-100 hover:text-instrument-600 dark:hover:bg-steel-700" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(w)} className="rounded-md p-1.5 text-steel-400 hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>)}
              {!loading && workers.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-steel-400">No workers yet. Add your first one.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingWorker ? "Edit Worker" : "Add Worker"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input {...register("name")} error={errors.name?.message} />
          </div>
          <div>
            <Label>Employee ID</Label>
            <Input {...register("employee_id")} error={errors.employee_id?.message} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} error={errors.phone?.message} />
          </div>
          <div>
            <Label>Status</Label>
            <Select {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingWorker ? "Save Changes" : "Add Worker"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove Worker?" size="sm">
        <p className="text-sm text-steel-500 dark:text-steel-400">
          {deleting?.name} will be removed from the worker list. Past production logs referencing them are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>;
}
export {
  WorkersPage as default
};
