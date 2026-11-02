"use client";
import { useMemo } from "react";
import { orderBy, limit } from "firebase/firestore";
import { Boxes, Coins, TrendingUp, Wallet, Cog } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import { useCollection } from "@/hooks/useCollection";
import { useToday } from "@/hooks/useToday";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getMachineCurrentState, getOrderProgress } from "@/lib/production-helpers";
import { GaugeStat } from "@/components/ui/GaugeStat";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
const PALETTE = ["#F5A623", "#2A5486", "#4C9A6A", "#C24444", "#8F5100", "#565F6C"];
function DashboardPage() {
  const { settings } = useSettings();
  const { data: logs, loading: logsLoading } = useCollection("production_logs", [
    orderBy("created_at", "desc"),
    limit(500)
  ]);
  const { data: machines } = useCollection("machines", [orderBy("name")]);
  const { data: products } = useCollection("products", [orderBy("name")]);
  const { data: workers } = useCollection("workers", [orderBy("name")]);
  const { data: orders } = useCollection("orders", [orderBy("sequence", "asc")]);
  const today = useToday();
  const monthPrefix = today ? today.slice(0, 7) : "";
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const machineMap = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);
  const workerMap = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const todayLogs = today ? logs.filter((l) => l.date === today) : [];
  const monthLogs = monthPrefix ? logs.filter((l) => l.date.startsWith(monthPrefix)) : [];
  const todayPieces = todayLogs.reduce((s, l) => s + l.total_quantity, 0);
  const todayRevenue = todayLogs.reduce((s, l) => s + l.total_bill, 0);
  const monthPieces = monthLogs.reduce((s, l) => s + l.total_quantity, 0);
  const monthRevenue = monthLogs.reduce((s, l) => s + l.total_bill, 0);
  const dailyMap = /* @__PURE__ */ new Map();
  monthLogs.forEach((l) => dailyMap.set(l.date, (dailyMap.get(l.date) ?? 0) + l.total_quantity));
  const dailyData = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, qty]) => ({ date: date.slice(5), qty }));
  const machineTotals = /* @__PURE__ */ new Map();
  monthLogs.forEach((l) => machineTotals.set(l.machine_id, (machineTotals.get(l.machine_id) ?? 0) + l.total_quantity));
  const machineData = Array.from(machineTotals.entries()).map(([id, qty]) => ({
    name: machineMap.get(id)?.name ?? "Unknown",
    qty
  }));
  const productTotals = /* @__PURE__ */ new Map();
  monthLogs.forEach((l) => l.items.forEach((i) => productTotals.set(i.product_id, (productTotals.get(i.product_id) ?? 0) + i.quantity)));
  const productData = Array.from(productTotals.entries()).map(([id, qty], idx) => ({
    name: productMap.get(id)?.name ?? "Unknown",
    value: qty,
    fill: PALETTE[idx % PALETTE.length]
  }));
  const revenueMap = /* @__PURE__ */ new Map();
  monthLogs.forEach((l) => revenueMap.set(l.date, (revenueMap.get(l.date) ?? 0) + l.total_bill));
  const revenueData = Array.from(revenueMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-14).map(([date, revenue]) => ({ date: date.slice(5), revenue }));
  const recentEntries = logs.slice(0, 6);
  if (logsLoading) {
    return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>;
  }
  return <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Dashboard</h1>
        <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">{today ? formatDate(today) : "—"} · Floor overview</p>
      </div>

      {
    /* KPI gauges */
  }
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GaugeStat label="Today's Production" value={`${todayLogs.length}`} subvalue="shift entries" icon={Boxes} tone="instrument" fill={Math.min(100, todayLogs.length * 20)} />
        <GaugeStat label="Today's Pieces" value={todayPieces.toLocaleString()} subvalue="units produced" icon={TrendingUp} tone="gauge" fill={Math.min(100, todayPieces / 10)} />
        <GaugeStat label="Today's Revenue" value={formatCurrency(todayRevenue, settings.currency)} icon={Coins} tone="ok" fill={Math.min(100, todayRevenue / 100)} />
        <GaugeStat label="Monthly Revenue" value={formatCurrency(monthRevenue, settings.currency)} subvalue={`${monthPieces.toLocaleString()} pcs this month`} icon={Wallet} tone="instrument" fill={Math.min(100, monthRevenue / 1e3)} />
      </div>

      {
    /* Machine status */
  }
      <Card>
        <CardHeader><CardTitle>Machine Status</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {machines.map((m) => {
            const state = getMachineCurrentState(logs, m.id);
            const activeOrder = orders.find((o) => o.machine_id === m.id && o.status === "active");
            const countLeft = activeOrder ? Math.max(0, activeOrder.target_quantity - getOrderProgress(activeOrder, logs)) : null;
            return (
              <div key={m.id} className="rounded-lg border border-steel-100 p-3 dark:border-steel-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cog className="h-4 w-4 text-steel-400" />
                    <span className="text-sm font-medium text-steel-700 dark:text-steel-200">{m.name}</span>
                  </div>
                  <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (m.status === "running" ? "bg-ok/10 text-ok" : m.status === "idle" ? "bg-steel-200 text-steel-600 dark:bg-steel-700 dark:text-steel-300" : "bg-danger/10 text-danger")}>
                    {m.status}
                  </span>
                </div>
                {state ? (
                  <div className="mt-2 space-y-1 text-xs text-steel-500 dark:text-steel-400">
                    <p>Running: <span className="font-medium text-steel-700 dark:text-steel-200">{productMap.get(state.productId)?.name ?? "Unknown"}</span></p>
                    <p>Last count: <span className="font-mono">{state.lastCount}</span></p>
                    {countLeft != null && <p>Left on order: <span className="font-mono text-gauge-600 dark:text-gauge-300">{countLeft.toLocaleString()} pcs</span></p>}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-steel-400">No production logged yet.</p>
                )}
              </div>
            );
          })}
          {machines.length === 0 && <p className="text-sm text-steel-400">No machines added yet.</p>}
        </CardBody>
      </Card>

      {
    /* Charts */
  }
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Daily Production (pieces)</CardTitle></CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-steel-100 dark:text-steel-800" />
                <XAxis dataKey="date" fontSize={12} stroke="currentColor" className="text-steel-400" />
                <YAxis fontSize={12} stroke="currentColor" className="text-steel-400" />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="qty" stroke="#F5A623" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-steel-100 dark:text-steel-800" />
                <XAxis dataKey="date" fontSize={12} stroke="currentColor" className="text-steel-400" />
                <YAxis fontSize={12} stroke="currentColor" className="text-steel-400" />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} formatter={(v) => formatCurrency(v, settings.currency)} />
                <Line type="monotone" dataKey="revenue" stroke="#2A5486" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Machine-wise Production</CardTitle></CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={machineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-steel-100 dark:text-steel-800" />
                <XAxis dataKey="name" fontSize={12} stroke="currentColor" className="text-steel-400" />
                <YAxis fontSize={12} stroke="currentColor" className="text-steel-400" />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="qty" fill="#2A5486" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Product-wise Production</CardTitle></CardHeader>
          <CardBody className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {productData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {
    /* Recent entries */
  }
      <Card>
        <CardHeader><CardTitle>Recent Entries</CardTitle></CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400 dark:bg-steel-900">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Machine</th>
                <th className="px-4 py-3">Workers</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Bill</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map((log) => <tr key={log.id} className="border-t border-steel-100 dark:border-steel-700">
                  <td className="px-4 py-3">{formatDate(log.date)}</td>
                  <td className="px-4 py-3 capitalize">{log.shift}</td>
                  <td className="px-4 py-3">{machineMap.get(log.machine_id)?.name ?? "\u2014"}</td>
                  <td className="px-4 py-3">{workerMap.get(log.worker1_id)?.name ?? "\u2014"} & {workerMap.get(log.worker2_id)?.name ?? "\u2014"}</td>
                  <td className="px-4 py-3 text-right font-mono">{log.total_quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(log.total_bill, settings.currency)}</td>
                </tr>)}
              {recentEntries.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-steel-400">No production logged yet. Start with a New Entry.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>;
}
export {
  DashboardPage as default
};
