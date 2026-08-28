import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { DeliveryBadge } from "@/components/orders/delivery-badge";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/orders/states";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatFull } from "@/lib/format";
import { webhookEventsQuery } from "@/lib/orders/queries";
import type { WebhookEvent } from "@/lib/orders/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/webhooks")({
  head: () => ({
    meta: [
      { title: "Webhook Events — Pop-up Orders" },
      {
        name: "description",
        content:
          "Review webhook callback history for pop-up orders, including delivery status, retries, and payloads.",
      },
      { property: "og:title", content: "Webhook Events — Pop-up Orders" },
      {
        property: "og:description",
        content: "Delivery status, retry attempts, and payloads for every order webhook.",
      },
    ],
  }),
  component: WebhookEventsPage,
});

function EventRow({ event }: { event: WebhookEvent }) {
  const [open, setOpen] = useState(false);
  const panelId = `event-panel-${event.id}`;

  return (
    <li className="border-b border-border last:border-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60 focus-visible:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:grid-cols-[150px_92px_minmax(0,1fr)_110px_70px_140px_20px]"
      >
        <span className="truncate font-mono text-xs text-muted-foreground">{event.id}</span>
        <span className="hidden font-mono text-xs md:inline">{event.orderId}</span>
        <span className="hidden truncate text-sm md:inline">{event.eventType}</span>
        <span className="hidden md:inline">
          <DeliveryBadge status={event.deliveryStatus} />
        </span>
        <span className="hidden text-xs tabular text-muted-foreground md:inline">
          {event.attemptCount} {event.attemptCount === 1 ? "try" : "tries"}
        </span>
        <span className="hidden text-xs tabular text-muted-foreground md:inline">
          {formatDateTime(event.createdAt)}
        </span>

        {/* Mobile summary */}
        <span className="flex items-center gap-2 md:hidden">
          <DeliveryBadge status={event.deliveryStatus} />
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-muted-foreground transition-transform md:block",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      <div className="px-3 pb-2 text-xs text-muted-foreground md:hidden">
        {event.eventType} · {event.orderId} · {formatDateTime(event.createdAt)}
      </div>

      {open ? (
        <div id={panelId} className="grid gap-3 bg-secondary/40 px-3 py-3 md:grid-cols-2">
          <div>
            <h3 className="text-xs font-semibold tracking-wide uppercase">Delivery attempts</h3>
            <p className="mt-1 text-xs text-muted-foreground">Endpoint: {event.endpoint}</p>
            <ul className="mt-2 grid gap-1.5">
              {event.attempts.map((attempt) => (
                <li
                  key={attempt.attempt}
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">Attempt {attempt.attempt}</span>
                    <span className="tabular text-muted-foreground">
                      {attempt.responseCode ?? "—"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{attempt.message}</p>
                  <p className="text-muted-foreground">{formatFull(attempt.at)} UTC</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-wide uppercase">Payload</h3>
            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-card p-2.5 text-xs">
              <code>{JSON.stringify(event.payload, null, 2)}</code>
            </pre>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function WebhookEventsPage() {
  const query = useQuery(webhookEventsQuery());
  const events = query.data ?? [];

  return (
    <PageShell>
      <PageHeader
        title="Webhook Events"
        description="Callback delivery history for order updates."
      />

      <Card className="overflow-hidden py-0 shadow-card">
        {query.isPending ? (
          <TableSkeleton columns={6} />
        ) : query.isError ? (
          <ErrorState
            description="We couldn't load webhook history. Please try again."
            onRetry={() => query.refetch()}
          />
        ) : events.length === 0 ? (
          <EmptyState
            title="No webhook events"
            description="Once orders start syncing, delivery attempts will appear here."
          />
        ) : (
          <>
            <div className="hidden grid-cols-[150px_92px_minmax(0,1fr)_110px_70px_140px_20px] gap-3 border-b border-border bg-secondary/50 px-3 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase md:grid">
              <span>Event ID</span>
              <span>Order ID</span>
              <span>Event type</span>
              <span>Delivery</span>
              <span>Attempts</span>
              <span>Created</span>
              <span className="sr-only">Expand</span>
            </div>
            <ul>
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          </>
        )}
      </Card>
    </PageShell>
  );
}
