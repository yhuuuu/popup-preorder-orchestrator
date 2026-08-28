import { cn } from "@/lib/utils";
import type { WebhookDeliveryStatus } from "@/lib/orders/types";

const styles: Record<WebhookDeliveryStatus, string> = {
  success: "bg-status-ready text-status-ready-foreground",
  failed: "bg-status-cancelled text-status-cancelled-foreground",
  retrying: "bg-status-pending text-status-pending-foreground",
};

const labels: Record<WebhookDeliveryStatus, string> = {
  success: "Success",
  failed: "Failed",
  retrying: "Retrying",
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
