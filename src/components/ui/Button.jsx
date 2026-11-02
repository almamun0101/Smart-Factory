"use client";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
const variants = {
  primary: "bg-instrument-600 text-white hover:bg-instrument-500 active:bg-instrument-700 shadow-sm",
  secondary: "bg-steel-100 text-steel-800 hover:bg-steel-200 dark:bg-steel-800 dark:text-steel-100 dark:hover:bg-steel-700",
  ghost: "bg-transparent text-steel-600 hover:bg-steel-100 dark:text-steel-300 dark:hover:bg-steel-800",
  danger: "bg-danger text-white hover:brightness-110"
};
const sizes = {
  sm: "text-sm px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2.5 gap-2",
  lg: "text-base px-5 py-3 gap-2"
};
const Button = forwardRef(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gauge-400 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>;
  }
);
Button.displayName = "Button";
export {
  Button
};
