import { cn } from "@/lib/utils";
import { STATUS_LABELS, type OrderStatus } from "@/lib/orders/types";

const styles: Record<OrderStatus, string> = {
  pending: "bg-status-pending text-status-pending-foreground",
  preparing: "bg-status-preparing text-status-preparing-foreground",
  ready: "bg-status-ready text-status-ready-foreground",
  cancelled: "bg-status-cancelled text-status-cancelled-foreground",
};

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status]}
    </span>
  );
}
