"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };
function Modal({ open, onClose, title, children, size = "md" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
    className="absolute inset-0 bg-steel-950/50 backdrop-blur-sm animate-in fade-in"
    onClick={onClose}
  />
      <div
    className={cn(
      "relative w-full rounded-panel bg-white shadow-2xl dark:bg-steel-800",
      "max-h-[90vh] overflow-y-auto",
      sizes[size]
    )}
  >
        <div className="flex items-center justify-between border-b border-steel-100 px-5 py-4 dark:border-steel-700">
          <h3 className="font-display text-base font-semibold text-steel-800 dark:text-steel-100">{title}</h3>
          <button
    onClick={onClose}
    className="rounded-md p-1 text-steel-400 hover:bg-steel-100 hover:text-steel-600 dark:hover:bg-steel-700"
    aria-label="Close"
  >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>;
}
export {
  Modal
};
