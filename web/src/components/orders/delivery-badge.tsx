import { cn } from "@/lib/utils";
import type { WebhookDeliveryStatus } from "@/lib/orders/types";

const styles: Record<WebhookDeliveryStatus, string> = {
  received: "bg-status-pending text-status-pending-foreground",
  processed: "bg-status-completed text-status-completed-foreground",
  failed: "bg-status-cancelled text-status-cancelled-foreground",
};

const labels: Record<WebhookDeliveryStatus, string> = {
  received: "Received",
  processed: "Processed",
  failed: "Failed",
};

export function DeliveryBadge({
  status,
  className,
}: {
  status: WebhookDeliveryStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        styles[status],
        className,
      )}
    >
      {labels[status]}
    </span>
  );
}
