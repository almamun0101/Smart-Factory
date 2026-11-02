"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  ListChecks,
  Users,
  Cog,
  Package,
  FileBarChart,
  Settings,
  Factory,
  ListOrdered,
  CalendarDays,
  TrendingUp,
  Receipt,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/production", label: "Production Count", icon: ClipboardList },
  { href: "/production/logs", label: "Production Logs", icon: ListChecks },
  { href: "/daily", label: "Daily", icon: CalendarDays },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/workers", label: "Workers", icon: Users },
  { href: "/machines", label: "Machines", icon: Cog },
  { href: "/products", label: "Products", icon: Package },
  { href: "/income", label: "Income", icon: TrendingUp },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings }
];
function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  return <>
      {
    /* Mobile overlay */
  }
      {open && <div className="fixed inset-0 z-40 bg-steel-950/50 lg:hidden" onClick={onClose} />}
      <aside
    className={cn(
      "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-steel-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
      "dark:border-steel-700 dark:bg-steel-900",
      open ? "translate-x-0" : "-translate-x-full"
    )}
  >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-instrument-600 text-white">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-sm font-bold leading-tight text-steel-800 dark:text-steel-50">
                Production
              </p>
              <p className="text-[11px] leading-tight text-steel-400">Control Panel</p>
            </div>
          </div>
          <button onClick={onClose} className="text-steel-400 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
    const active = pathname === item.href || item.href !== "/production" && pathname?.startsWith(item.href);
    const Icon = item.icon;
    return <Link
      key={item.href}
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-gauge-50 text-instrument-700 dark:bg-instrument-600/20 dark:text-gauge-300" : "text-steel-500 hover:bg-steel-100 hover:text-steel-800 dark:text-steel-400 dark:hover:bg-steel-800 dark:hover:text-steel-100"
      )}
    >
                <Icon className={cn("h-4.5 w-4.5", active && "text-gauge-500")} />
                {item.label}
              </Link>;
  })}
        </nav>

        <div className="border-t border-steel-100 px-5 py-4 dark:border-steel-700">
          <p className="text-[11px] text-steel-400">v1.0 · Built for the floor, not the boardroom</p>
        </div>
      </aside>
    </>;
}
export {
  Sidebar
};
