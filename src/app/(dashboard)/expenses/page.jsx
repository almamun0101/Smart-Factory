"use client";

import { useState } from "react";
import { orderBy } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { createDoc, updateDocById, deleteDocById } from "@/lib/firestore-service";
import { expenseSchema } from "@/lib/schemas";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRow } from "@/components/ui/Skeleton";

const CATEGORIES = ["Machine", "Utility", "Maintenance", "Salary", "Other"];

export default function ExpensesPage() {
  const { settings } = useSettings();
  const { data: expenses, loading } = useCollection("expenses", [orderBy("date", "desc")]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: { name: "", category: "Machine", amount: 0, date: todayISO(), notes: "" },
  });

  function openCreate() {
    setEditing(null);
    reset({ name: "", category: "Machine", amount: 0, date: todayISO(), notes: "" });
    setModalOpen(true);
  }

  function openEdit(exp) {
    setEditing(exp);
    reset({ name: exp.name, category: exp.category, amount: exp.amount, date: exp.date, notes: exp.notes ?? "" });
    setModalOpen(true);
  }

  async function onSubmit(values) {
    try {
      if (editing) {
        await updateDocById("expenses", editing.id, values);
        toast.success("Expense updated");
      } else {
        await createDoc("expenses", { ...values, created_at: Date.now() });
        toast.success("Expense added");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Could not save expense");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDocById("expenses", deleting.id);
      toast.success("Expense removed");
      setDeleting(null);
    } catch (err) {
      toast.error(err.message || "Failed to remove expense");
    } finally {
      setBusy(false);
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Expenses</h1>
          <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">Machine purchases, maintenance, and other factory costs.</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Expense</Button>
      </div>

      <Card>
        <CardBody>
          <p className="text-xs font-semibold uppercase tracking-wide text-steel-400">Total Expenses</p>
          <p className="mt-1 font-display text-2xl font-bold text-danger">{formatCurrency(totalExpenses, settings.currency)}</p>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400 dark:bg-steel-900">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={6} />)}
              {!loading && expenses.map((e) => (
                <tr key={e.id} className="border-t border-steel-100 dark:border-steel-700">
                  <td className="px-4 py-3">{formatDate(e.date)}</td>
                  <td className="px-4 py-3 font-medium text-steel-700 dark:text-steel-200">{e.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-steel-100 px-2 py-0.5 text-xs font-semibold text-steel-600 dark:bg-steel-700 dark:text-steel-300">{e.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-danger">{formatCurrency(e.amount, settings.currency)}</td>
                  <td className="px-4 py-3 text-steel-400">{e.notes || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(e)} className="rounded-md p-1.5 text-steel-400 hover:bg-steel-100 hover:text-instrument-600 dark:hover:bg-steel-700" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(e)} className="rounded-md p-1.5 text-steel-400 hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && expenses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-steel-400">No expenses logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Expense" : "Add Expense"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Machine 2 motor replacement" />
          </div>
          <div>
            <Label>Category</Label>
            <Select {...register("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label>Amount</Label>
            <Input type="number" step="0.01" {...register("amount")} error={errors.amount?.message} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" {...register("date")} error={errors.date?.message} />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Input {...register("notes")} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? "Save Changes" : "Add Expense"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove Expense?" size="sm">
        <p className="text-sm text-steel-500 dark:text-steel-400">This will permanently remove "{deleting?.name}".</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
