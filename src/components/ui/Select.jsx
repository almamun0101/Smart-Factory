import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
const Select = forwardRef(
  ({ className, error, children, ...props }, ref) => <div className="w-full">
      <div className="relative">
        <select
    ref={ref}
    className={cn(
      "w-full appearance-none rounded-lg border px-3 py-2.5 pr-9 text-sm bg-white text-steel-800",
      "border-steel-200 focus:border-instrument-500 focus:outline-none focus:ring-2 focus:ring-instrument-500/20",
      "dark:bg-steel-900 dark:text-steel-100 dark:border-steel-600",
      error && "border-danger focus:border-danger focus:ring-danger/20",
      className
    )}
    {...props}
  >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
);
Select.displayName = "Select";
export {
  Select
};
