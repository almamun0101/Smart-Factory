"use client";
import { useMemo, useState } from "react";
import { orderBy } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import { useCollection } from "@/hooks/useCollection";
import { useSettings } from "@/contexts/SettingsContext";
import { createDoc, updateDocById, deleteDocById } from "@/lib/firestore-service";
import { productSchema } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard } from "@/components/ui/Skeleton";
function ProductsPage() {
  const { settings } = useSettings();
  const { data: products, loading } = useCollection("products", [orderBy("name")]);
  const { data: logs } = useCollection("production_logs");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", price_per_piece: 0, rate_per_minute: 1 }
  });
  const productStats = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    logs.forEach((log) => {
      log.items.forEach((item) => {
        const entry = map.get(item.product_id) ?? { qty: 0, revenue: 0 };
        const product = products.find((p) => p.id === item.product_id);
        entry.qty += item.quantity;
        entry.revenue += item.quantity * (product?.price_per_piece ?? 0);
        map.set(item.product_id, entry);
      });
    });
    return map;
  }, [logs, products]);
  function openCreate() {
    setEditingProduct(null);
    reset({ name: "", price_per_piece: 0, rate_per_minute: 1 });
    setModalOpen(true);
  }
  function openEdit(p) {
    setEditingProduct(p);
    reset({ name: p.name, price_per_piece: p.price_per_piece, rate_per_minute: p.rate_per_minute ?? 1 });
    setModalOpen(true);
  }
  async function onSubmit(values) {
    try {
      if (editingProduct) {
        await updateDocById("products", editingProduct.id, values);
        toast.success("Product updated");
      } else {
        await createDoc("products", { ...values, created_at: Date.now() });
        toast.success("Product added");
      }
      setModalOpen(false);
    } catch {
      toast.error("Could not save product");
    }
  }
  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteDocById("products", deleting.id);
      toast.success("Product removed");
      setDeleting(null);
    } catch {
      toast.error("Failed to remove product");
    } finally {
      setBusy(false);
    }
  }
  return <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-steel-800 dark:text-steel-50">Products</h1>
          <p className="mt-1 text-sm text-steel-500 dark:text-steel-400">{products.length} products in the catalog</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && products.map((p) => {
    const stat = productStats.get(p.id) ?? { qty: 0, revenue: 0 };
    return <Card key={p.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gauge-50 text-gauge-600 dark:bg-gauge-900/30 dark:text-gauge-300">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-steel-800 dark:text-steel-50">{p.name}</p>
                      <p className="font-mono text-xs text-steel-400">{formatCurrency(p.price_per_piece, settings.currency)} / pc · {p.rate_per_minute ?? "?"}/min</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-md p-1.5 text-steel-400 hover:bg-steel-100 hover:text-instrument-600 dark:hover:bg-steel-700" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleting(p)} className="rounded-md p-1.5 text-steel-400 hover:bg-danger/10 hover:text-danger" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-steel-100 pt-3 dark:border-steel-700">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-steel-400">Total Produced</p>
                    <p className="font-mono text-sm font-semibold text-steel-700 dark:text-steel-200">{stat.qty.toLocaleString()} pcs</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-steel-400">Total Revenue</p>
                    <p className="font-mono text-sm font-semibold text-instrument-600 dark:text-gauge-300">{formatCurrency(stat.revenue, settings.currency)}</p>
                  </div>
                </div>
              </CardBody>
            </Card>;
  })}
        {!loading && products.length === 0 && <p className="text-sm text-steel-400">No products yet. Add your first one.</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Product Name</Label>
            <Input {...register("name")} error={errors.name?.message} placeholder="e.g. Cotton Yarn 40s" />
          </div>
          <div>
            <Label>Price Per Piece</Label>
            <Input type="number" step="0.01" {...register("price_per_piece")} error={errors.price_per_piece?.message} />
          </div>
          <div>
            <Label>Rate (pieces / minute)</Label>
            <Input type="number" step="0.1" {...register("rate_per_minute")} error={errors.rate_per_minute?.message} />
            <p className="mt-1 text-xs text-steel-400">Used to suggest order completion times on the Orders page.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={isSubmitting}>{editingProduct ? "Save Changes" : "Add Product"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove Product?" size="sm">
        <p className="text-sm text-steel-500 dark:text-steel-400">
          {deleting?.name} will be removed from the catalog. Past production logs referencing it are kept.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" loading={busy} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>;
}
export {
  ProductsPage as default
};
