import { cn } from "@/lib/utils";
function Skeleton({ className }) {
  return <div
    className={cn(
      "animate-pulse rounded-md bg-steel-200/70 dark:bg-steel-700/60",
      className
    )}
  />;
}
function SkeletonCard() {
  return <div className="rounded-panel border border-steel-200 bg-white p-5 dark:border-steel-700 dark:bg-steel-800">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>;
}
function SkeletonRow({ cols = 6 }) {
  return <tr>
      {Array.from({ length: cols }).map((_, i) => <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>)}
    </tr>;
}
export {
  Skeleton,
  SkeletonCard,
  SkeletonRow
};
