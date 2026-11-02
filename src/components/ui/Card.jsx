import { cn } from "@/lib/utils";
function Card({ className, ...props }) {
  return <div
    className={cn(
      "rounded-panel border border-steel-200 bg-white shadow-panel",
      "dark:border-steel-700 dark:bg-steel-800 dark:shadow-panel-dark",
      className
    )}
    {...props}
  />;
}
function CardHeader({ className, ...props }) {
  return <div
    className={cn("flex items-center justify-between px-5 py-4 border-b border-steel-100 dark:border-steel-700", className)}
    {...props}
  />;
}
function CardTitle({ className, ...props }) {
  return <h3
    className={cn("font-display text-base font-semibold text-steel-800 dark:text-steel-100", className)}
    {...props}
  />;
}
function CardBody({ className, ...props }) {
  return <div className={cn("p-5", className)} {...props} />;
}
export {
  Card,
  CardBody,
  CardHeader,
  CardTitle
};
