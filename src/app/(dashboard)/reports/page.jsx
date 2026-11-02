"use client";
import { useEffect, useMemo, useState } from "react";
import { orderBy } from "firebase/firestore";
import { Printer, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
function ReportsPage() {
  const { settings } = useSettings();
  const { data: logs } = useCollection("production_logs", [orderBy("date", "asc")]);
  const { data: machines } = useCollection("machines", [orderBy("name")]);
  const { data: workers } = useCollection("workers", [orderBy("name")]);
  const { data: products } = useCollection("products", [orderBy("name")]);
  const machineMap = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);
  const workerMap = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  // Start blank so the server-rendered HTML and the browser's first paint
  // agree (this page can be pre-rendered at build time, and a date baked in
  // then would mismatch the browser's actual date on every later visit).
  // The real default range is filled in right after mount.
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  useEffect(() => {
    const today = todayISO();
    setStartDate(today.slice(0, 8) + "01");
    setEndDate(today);
  }, []);
  const [machineFilter, setMachineFilter] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const filtered = logs.filter((log) => {
    if (log.date < startDate || log.date > endDate) return false;
    if (machineFilter && log.machine_id !== machineFilter) return false;
    if (shiftFilter && log.shift !== shiftFilter) return false;
    if (workerFilter && log.worker1_id !== workerFilter && log.worker2_id !== workerFilter) return false;
    if (productFilter && !log.items.some((i) => i.product_id === productFilter)) return false;
    return true;
  });
  const totalQty = filtered.reduce((s, l) => s + l.total_quantity, 0);
  const totalRevenue = filtered.reduce((s, l) => s + l.total_bill, 0);
  function exportExcel() {
    const rows = filtered.map((log) => ({
      Date: log.date,
      Shift: log.shift,
      Machine: machineMap.get(log.machine_id)?.name ?? "",
      "Worker 1": workerMap.get(log.worker1_id)?.name ?? "",
      "Worker 2": workerMap.get(log.worker2_id)?.name ?? "",
      Operator: log.operator_name,
      Products: log.items.map((i) => `${productMap.get(i.product_id)?.name ?? "?"} x${i.quantity}`).join(", "),
      Quantity: log.total_quantity,
      Bill: log.total_bill
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production Report");
    XLSX.writeFile(wb, `production-report_${startDate}_to_${endDate}.xlsx`);
  }
  function printReport() {
    window.print();
  }
  return <div className="space-y-4">
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Reports</h1>
          <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">Filter, export, and print production reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={printReport}><Printer className="h-4 w-4" /> Print / PDF</Button>
          <Button onClick={exportExcel}><FileSpreadsheet className="h-4 w-4" /> Export Excel</Button>
        </div>
      </div>

      <Card className="no-print">
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label>Start Date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label>End Date</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Label>Machine</Label>
            <Select value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}>
              <option value="">All machines</option>
              {machines.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Worker</Label>
            <Select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}>
              <option value="">All workers</option>
              {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Shift</Label>
            <Select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}>
              <option value="">All shifts</option>
              <option value="day">Day</option>
              <option value="night">Night</option>
            </Select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Label>Product</Label>
            <Select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
              <option value="">All products</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
        </CardBody>
      </Card>

      <div id="print-area">
        <Card>
          <CardHeader>
            <CardTitle>{settings.factory_name} — Production Report</CardTitle>
            <span className="text-xs text-steel-400">{startDate && endDate ? `${formatDate(startDate)} – ${formatDate(endDate)}` : "Loading…"}</span>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400 dark:bg-steel-900">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3">Machine</th>
                  <th className="px-4 py-3">Workers</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Bill</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => <tr key={log.id} className="border-t border-steel-100 dark:border-steel-700">
                    <td className="px-4 py-3">{formatDate(log.date)}</td>
                    <td className="px-4 py-3 capitalize">{log.shift}</td>
                    <td className="px-4 py-3">{machineMap.get(log.machine_id)?.name ?? "\u2014"}</td>
                    <td className="px-4 py-3">{workerMap.get(log.worker1_id)?.name ?? "\u2014"} & {workerMap.get(log.worker2_id)?.name ?? "\u2014"}</td>
                    <td className="px-4 py-3">{log.items.map((i) => `${productMap.get(i.product_id)?.name ?? "?"} x${i.quantity}`).join(", ")}</td>
                    <td className="px-4 py-3 text-right font-mono">{log.total_quantity}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(log.total_bill, settings.currency)}</td>
                  </tr>)}
                {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-steel-400">No entries match the selected filters.</td></tr>}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-steel-200 font-semibold dark:border-steel-600">
                  <td className="px-4 py-3" colSpan={5}>Totals</td>
                  <td className="px-4 py-3 text-right font-mono">{totalQty}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalRevenue, settings.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>;
}
export {
  ReportsPage as default
};
