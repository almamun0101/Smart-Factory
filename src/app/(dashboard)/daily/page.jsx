"use client";

import { useMemo } from "react";
import { orderBy } from "firebase/firestore";
import { Cog } from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToday } from "@/hooks/useToday";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export default function DailyPage() {
  const { settings } = useSettings();
  const today = useToday();
  const { data: logs, loading } = useCollection("production_logs", [orderBy("created_at", "desc")]);
  const { data: machines } = useCollection("machines", [orderBy("name")]);
  const { data: workers } = useCollection("workers", [orderBy("name")]);
  const { data: products } = useCollection("products", [orderBy("name")]);

  const machineMap = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);
  const workerMap = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const todayLogs = today ? logs.filter((l) => l.date === today) : [];

  // Group today's logs by machine, then by shift, so the page reads like
  // "for each machine, what happened in each shift today" rather than a
  // flat list of raw log rows.
  const byMachine = new Map();
  todayLogs.forEach((log) => {
    const group = byMachine.get(log.machine_id) ?? { day: [], night: [] };
    group[log.shift].push(log);
    byMachine.set(log.machine_id, group);
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Daily Production</h1>
        <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">{today ? formatDate(today) : "—"} · Machine × shift × product breakdown</p>
      </div>

      {!loading && byMachine.size === 0 && (
        <Card><CardBody className="py-10 text-center text-sm text-steel-400">No production counted yet today.</CardBody></Card>
      )}

      <div className="space-y-4">
        {machines.filter((m) => byMachine.has(m.id)).map((machine) => {
          const group = byMachine.get(machine.id);
          return (
            <Card key={machine.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cog className="h-4 w-4 text-steel-400" /> {machine.name}</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {["day", "night"].map((shift) => (
                  <div key={shift} className="rounded-lg border border-steel-100 p-3 dark:border-steel-700">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-steel-400 capitalize">{shift} Shift</p>
                    {group[shift].length === 0 && <p className="text-sm text-steel-400">No entries logged.</p>}
                    {group[shift].map((log) => (
                      <div key={log.id} className="mb-2 last:mb-0">
                        <p className="text-xs text-steel-400">
                          {workerMap.get(log.worker1_id)?.name ?? "—"} &amp; {workerMap.get(log.worker2_id)?.name ?? "—"}
                        </p>
                        {log.items.map((item, i) => (
                          <div key={i} className="mt-1 flex items-center justify-between text-sm">
                            <span className="text-steel-700 dark:text-steel-200">{productMap.get(item.product_id)?.name ?? "Unknown"}</span>
                            <span className="font-mono text-steel-600 dark:text-steel-300">
                              {item.start_count ?? 0} → {item.end_count ?? item.quantity} <span className="text-gauge-600 dark:text-gauge-300">(+{item.quantity})</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
