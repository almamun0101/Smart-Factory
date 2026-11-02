"use client";

import { useMemo } from "react";
import { orderBy } from "firebase/firestore";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export default function IncomePage() {
  const { settings } = useSettings();
  const { data: logs, loading } = useCollection("production_logs", [orderBy("date", "asc")]);
  const { data: products } = useCollection("products", [orderBy("name")]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const rows = useMemo(() => {
    const map = new Map();
    logs.forEach((log) => {
      log.items.forEach((item) => {
        const entry = map.get(item.product_id) ?? { qty: 0, firstDate: log.date, lastDate: log.date, entries: 0 };
        entry.qty += item.quantity;
        entry.entries += 1;
        if (log.date < entry.firstDate) entry.firstDate = log.date;
        if (log.date > entry.lastDate) entry.lastDate = log.date;
        map.set(item.product_id, entry);
      });
    });
    return Array.from(map.entries()).map(([productId, entry]) => {
      const product = productMap.get(productId);
      const price = product?.price_per_piece ?? 0;
      return {
        productId,
        name: product?.name ?? "Unknown product",
        qty: entry.qty,
        price,
        income: entry.qty * price,
        firstDate: entry.firstDate,
        lastDate: entry.lastDate,
        entries: entry.entries,
      };
    }).sort((a, b) => b.income - a.income);
  }, [logs, productMap]);

  const totalIncome = rows.reduce((s, r) => s + r.income, 0);
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Income</h1>
        <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">Finished counts and revenue by product, across all logged production.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-steel-400">Total Pieces Produced</p>
            <p className="mt-1 font-display text-2xl font-bold text-steel-800 dark:text-steel-50">{totalQty.toLocaleString()}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-steel-400">Total Income</p>
            <p className="mt-1 font-display text-2xl font-bold text-instrument-600 dark:text-gauge-300">{formatCurrency(totalIncome, settings.currency)}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>By Product</CardTitle></CardHeader>
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-400 dark:bg-steel-900">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Finished Count</th>
                <th className="px-4 py-3 text-right">Price / Piece</th>
                <th className="px-4 py-3 text-right">Income</th>
                <th className="px-4 py-3">First Logged</th>
                <th className="px-4 py-3">Last Logged</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.productId} className="border-t border-steel-100 dark:border-steel-700">
                  <td className="px-4 py-3 font-medium text-steel-700 dark:text-steel-200">{r.name}</td>
                  <td className="px-4 py-3 text-right font-mono">{r.qty.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(r.price, settings.currency)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-instrument-600 dark:text-gauge-300">{formatCurrency(r.income, settings.currency)}</td>
                  <td className="px-4 py-3">{formatDate(r.firstDate)}</td>
                  <td className="px-4 py-3">{formatDate(r.lastDate)}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-steel-400">No production logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
