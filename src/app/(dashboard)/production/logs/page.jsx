"use client";
import { useMemo, useState } from "react";
import { orderBy } from "firebase/firestore";
import { Eye, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { deleteDocById, updateDocById } from "@/lib/firestore-service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonRow } from "@/components/ui/Skeleton";
const PAGE_SIZE = 10;
function ProductionLogsPage() {
  const { settings } = useSettings();
  const { data: logs, loading } = useCollection("production_logs", [orderBy("created_at", "desc")]);
  const { data: machines } = useCollection("machines", [orderBy("name")]);
  const { data: workers } = useCollection("workers", [orderBy("name")]);
  const { data: products } = useCollection("products", [orderBy("name")]);
  const machineMap = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);
  const workerMap = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [search, setSearch] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  function openEdit(log) {
    setEditing(log);
    setEditDraft({
      date: log.date,
      shift: log.shift,
      machine_id: log.machine_id,
      worker1_id: log.worker1_id,
      worker2_id: log.worker2_id
    });
  }
  async function handleSaveEdit() {
    if (!editing || !editDraft) return;
    if (editDraft.worker1_id === editDraft.worker2_id) {
      toast.error("Worker 1 and Worker 2 must be different");
      return;
    }
    setBusy(true);
    try {
      await updateDocById("production_logs", editing.id, { ...editDraft, updated_at: Date.now() });
      toast.success("Entry updated");
      setEditing(null);
      setEditDraft(null);
    } catch {
      toast.error("Failed to update entry");
    } finally {
      setBusy(false);
    }
  }
  const filtered = logs.filter((log) => {
    if (machineFilter && log.machine_id !== machineFilter) return false;
    if (shiftFilter && log.shift !== shiftFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      const haystack = [
        machineMap.get(log.machine_id)?.name,
        workerMap.get(log.worker1_id)?.name,
        workerMap.get(log.worker2_id)?.name,
        log.operator_name,
        log.date
      ].join(" ").toLowerCase();
      if (!haystack.includes(s)) return false;
    }
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDocById("production_logs", deleting.id);
      toast.success("Entry deleted");
      setDeleting(null);
    } catch {
      toast.error("Failed to delete entry");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Production Logs</h1>
        <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">Search, filter, and manage every logged shift.</p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
            <Input
    placeholder="Search by machine, worker, operator, date…"
    className="pl-9"
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setPage(1);
    }}
  />
          </div>
          <Select value={machineFilter} onChange={(e) => {
    setMachineFilter(e.target.value);
    setPage(1);
  }} className="sm:w-48">
            <option value="">All machines</option>
            {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <Select value={shiftFilter} onChange={(e) => {
    setShiftFilter(e.target.value);
    setPage(1);
  }} className="sm:w-40">
            <option value="">All shifts</option>
            <option value="day">Day</option>
            <option value="night">Night</option>
          </Select>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400 dark:bg-steel-900">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Machine</th>
                <th className="px-4 py-3">Worker 1</th>
                <th className="px-4 py-3">Worker 2</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Bill</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />)}
              {!loading && paged.map((log) => <tr key={log.id} className="border-t border-steel-100 dark:border-steel-700">
                  <td className="px-4 py-3">{formatDate(log.date)}</td>
                  <td className="px-4 py-3 capitalize">{log.shift}</td>
                  <td className="px-4 py-3">{machineMap.get(log.machine_id)?.name ?? "\u2014"}</td>
                  <td className="px-4 py-3">{workerMap.get(log.worker1_id)?.name ?? "\u2014"}</td>
                  <td className="px-4 py-3">{workerMap.get(log.worker2_id)?.name ?? "\u2014"}</td>
                  <td className="px-4 py-3">{log.operator_name}</td>
                  <td className="px-4 py-3 text-right font-mono">{log.total_quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(log.total_bill, settings.currency)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewing(log)} className="rounded-md p-1.5 text-steel-400 hover:bg-steel-100 hover:text-instrument-600 dark:hover:bg-steel-700" aria-label="View">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button onClick={() => openEdit(log)} className="rounded-md p-1.5 text-steel-400 hover:bg-steel-100 hover:text-instrument-600 dark:hover:bg-steel-700" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleting(log)} className="rounded-md p-1.5 text-steel-400 hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>)}
              {!loading && paged.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-steel-400">No entries match your filters.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {totalPages > 1 && <div className="flex items-center justify-between text-sm text-steel-500">
          <span>Page {page} of {totalPages} · {filtered.length} entries</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>}

      {
    /* View modal */
  }
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Production Entry Details" size="md">
        {viewing && <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-steel-400">Date</p><p className="font-medium">{formatDate(viewing.date)}</p></div>
              <div><p className="text-xs text-steel-400">Shift</p><p className="font-medium capitalize">{viewing.shift}</p></div>
              <div><p className="text-xs text-steel-400">Machine</p><p className="font-medium">{machineMap.get(viewing.machine_id)?.name ?? "\u2014"}</p></div>
              <div><p className="text-xs text-steel-400">Operator</p><p className="font-medium">{viewing.operator_name}</p></div>
              <div><p className="text-xs text-steel-400">Worker 1</p><p className="font-medium">{workerMap.get(viewing.worker1_id)?.name ?? "\u2014"}</p></div>
              <div><p className="text-xs text-steel-400">Worker 2</p><p className="font-medium">{workerMap.get(viewing.worker2_id)?.name ?? "\u2014"}</p></div>
            </div>
            <div className="rounded-lg border border-steel-100 dark:border-steel-700">
              <table className="w-full text-sm">
                <thead className="bg-steel-50 text-xs uppercase text-steel-400 dark:bg-steel-900">
                  <tr><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Count</th><th className="px-3 py-2 text-right">Produced</th><th className="px-3 py-2 text-right">Total</th></tr>
                </thead>
                <tbody>
                  {viewing.items.map((item, i) => <tr key={i} className="border-t border-steel-100 dark:border-steel-700">
                      <td className="px-3 py-2">{productMap.get(item.product_id)?.name ?? "\u2014"}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-steel-400">{item.start_count ?? 0} → {item.end_count ?? item.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">{item.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {formatCurrency((productMap.get(item.product_id)?.price_per_piece ?? 0) * item.quantity, settings.currency)}
                      </td>
                    </tr>)}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between rounded-lg bg-steel-50 px-4 py-3 dark:bg-steel-900">
              <span className="font-semibold text-steel-600 dark:text-steel-300">Total Bill</span>
              <span className="font-mono font-bold text-instrument-600 dark:text-gauge-300">{formatCurrency(viewing.total_bill, settings.currency)}</span>
            </div>
          </div>}
      </Modal>

      {
    /* Edit modal — shift/crew/machine fields. Line items are edited by deleting and re-entering the log. */
  }
      <Modal open={!!editing} onClose={() => {
    setEditing(null);
    setEditDraft(null);
  }} title="Edit Entry" size="md">
        {editDraft && <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel-500">Date</label>
                <Input type="date" value={editDraft.date} onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel-500">Shift</label>
                <Select value={editDraft.shift} onChange={(e) => setEditDraft({ ...editDraft, shift: e.target.value })}>
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel-500">Machine</label>
              <Select value={editDraft.machine_id} onChange={(e) => setEditDraft({ ...editDraft, machine_id: e.target.value })}>
                {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel-500">Worker 1</label>
                <Select value={editDraft.worker1_id} onChange={(e) => setEditDraft({ ...editDraft, worker1_id: e.target.value })}>
                  {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel-500">Worker 2</label>
                <Select value={editDraft.worker2_id} onChange={(e) => setEditDraft({ ...editDraft, worker2_id: e.target.value })}>
                  {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </Select>
              </div>
            </div>
            <p className="text-xs text-steel-400">
              To change products or quantities, delete this entry and log a new one — that keeps the bill calculation accurate.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => {
    setEditing(null);
    setEditDraft(null);
  }}>Cancel</Button>
              <Button loading={busy} onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </div>}
      </Modal>

      {
    /* Delete confirm */
  }
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Entry?" size="sm">
        <p className="text-sm text-steel-500 dark:text-steel-400">
          This will permanently remove the production log for {deleting ? formatDate(deleting.date) : ""}. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>;
}
export {
  ProductionLogsPage as default
};
