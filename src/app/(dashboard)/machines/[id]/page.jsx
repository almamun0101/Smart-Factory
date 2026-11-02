"use client";
import { useParams, useRouter } from "next/navigation";
import { orderBy } from "firebase/firestore";
import { ArrowLeft, Boxes, Wallet, Cog } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatDate, todayISO } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { GaugeStat } from "@/components/ui/GaugeStat";
import { Button } from "@/components/ui/Button";
function MachineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { settings } = useSettings();
  const { data: machines, loading: mLoading } = useCollection("machines");
  const { data: logs, loading: lLoading } = useCollection("production_logs", [orderBy("created_at", "desc")]);
  const machine = machines.find((m) => m.id === params.id);
  const machineLogs = logs.filter((l) => l.machine_id === params.id);
  const totalProduction = machineLogs.reduce((s, l) => s + l.total_quantity, 0);
  const totalRevenue = machineLogs.reduce((s, l) => s + l.total_bill, 0);
  const totalProducts = new Set(machineLogs.flatMap((l) => l.items.map((i) => i.product_id))).size;
  const monthPrefix = todayISO().slice(0, 7);
  const dailyMap = /* @__PURE__ */ new Map();
  machineLogs.filter((l) => l.date.startsWith(monthPrefix)).forEach((l) => dailyMap.set(l.date, (dailyMap.get(l.date) ?? 0) + l.total_quantity));
  const dailyData = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, qty]) => ({ date: date.slice(5), qty }));
  const monthlyMap = /* @__PURE__ */ new Map();
  machineLogs.forEach((l) => monthlyMap.set(l.date.slice(0, 7), (monthlyMap.get(l.date.slice(0, 7)) ?? 0) + l.total_quantity));
  const monthlyData = Array.from(monthlyMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, qty]) => ({ month, qty }));
  if (mLoading || lLoading) return <p className="text-sm text-steel-400">Loading machine profile…</p>;
  if (!machine) {
    return <div className="space-y-4">
        <Button variant="secondary" onClick={() => router.push("/machines")}><ArrowLeft className="h-4 w-4" /> Back</Button>
        <p className="text-sm text-steel-400">Machine not found.</p>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => router.push("/machines")}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-instrument-600/10 text-instrument-600"><Cog className="h-5 w-5" /></div>
          <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">{machine.name}</h1>
        </div>
        <span className="ml-auto rounded-full bg-ok/10 px-2.5 py-1 text-xs font-semibold capitalize text-ok">{machine.status}</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GaugeStat label="Total Production" value={totalProduction.toLocaleString()} subvalue="pieces" icon={Boxes} tone="instrument" fill={Math.min(100, totalProduction / 20)} />
        <GaugeStat label="Products Produced" value={`${totalProducts}`} subvalue="distinct SKUs" icon={Boxes} tone="gauge" fill={Math.min(100, totalProducts * 15)} />
        <GaugeStat label="Revenue Generated" value={formatCurrency(totalRevenue, settings.currency)} icon={Wallet} tone="ok" fill={Math.min(100, totalRevenue / 500)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Daily Production (this month)</CardTitle></CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="text-steel-100 dark:text-steel-800" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="qty" fill="#F5A623" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Monthly Production Trend</CardTitle></CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="text-steel-100 dark:text-steel-800" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="qty" fill="#2A5486" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Logs</CardTitle></CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400 dark:bg-steel-900">
              <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Bill</th></tr>
            </thead>
            <tbody>
              {machineLogs.slice(0, 10).map((log) => <tr key={log.id} className="border-t border-steel-100 dark:border-steel-700">
                  <td className="px-4 py-3">{formatDate(log.date)}</td>
                  <td className="px-4 py-3 capitalize">{log.shift}</td>
                  <td className="px-4 py-3 text-right font-mono">{log.total_quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(log.total_bill, settings.currency)}</td>
                </tr>)}
              {machineLogs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-steel-400">No production logged for this machine yet.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>;
}
export {
  MachineDetailPage as default
};
