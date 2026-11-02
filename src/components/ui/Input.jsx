import { forwardRef } from "react";
import { cn } from "@/lib/utils";
const Input = forwardRef(
  ({ className, error, ...props }, ref) => <div className="w-full">
      <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border px-3 py-2.5 text-sm bg-white text-steel-800 placeholder:text-steel-400",
      "border-steel-200 focus:border-instrument-500 focus:outline-none focus:ring-2 focus:ring-instrument-500/20",
      "dark:bg-steel-900 dark:text-steel-100 dark:border-steel-600 dark:placeholder:text-steel-500",
      error && "border-danger focus:border-danger focus:ring-danger/20",
      className
    )}
    {...props}
  />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
);
Input.displayName = "Input";
function Label({ className, ...props }) {
  return <label
    className={cn("mb-1.5 block text-xs font-semibold uppercase tracking-wide text-steel-500 dark:text-steel-400", className)}
    {...props}
  />;
}
export {
  Input,
  Label
};
