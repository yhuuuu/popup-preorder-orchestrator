import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { ConfirmDialog } from "@/components/orders/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/orders/states";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFull } from "@/lib/format";
import { ApiError, ordersApi } from "@/lib/orders/api";
import { orderDetailQuery, orderKeys } from "@/lib/orders/queries";
import { STATUS_LABELS, type OrderStatus } from "@/lib/orders/types";

export const Route = createFileRoute("/orders/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderId} — Pop-up Orders` },
      {
        name: "description",
        content: `Full details and status controls for pop-up pre-order ${params.orderId}.`,
      },
      { property: "og:title", content: `Order ${params.orderId} — Pop-up Orders` },
      {
        property: "og:description",
        content: `Full details and status controls for pop-up pre-order ${params.orderId}.`,
      },
    ],
  }),
  component: OrderDetailPage,
});

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border py-2 last:border-0">
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="min-w-0 text-right text-sm">{value}</dd>
    </div>
  );
}

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery(orderDetailQuery(orderId));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: orderKeys.all });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateOrderStatus(orderId, status),
    onSuccess: async (order) => {
      await invalidate();
      toast.success(`Order ${order.id} marked as ${STATUS_LABELS[order.status].toLowerCase()}`);
    },
    onError: (error: Error) => toast.error("Status update failed", { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => ordersApi.deleteOrder(orderId),
    onSuccess: async () => {
      await invalidate();
      toast.success(`Order ${orderId} deleted`);
      navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error("Delete failed", { description: error.message }),
  });

  const backButton = (
    <Button asChild variant="outline" size="sm">
      <Link to="/">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All orders
      </Link>
    </Button>
  );

  if (query.isPending) {
    return (
      <PageShell>
        <PageHeader title={`Order ${orderId}`} actions={backButton} />
        <Card className="max-w-2xl shadow-card">
          <CardContent className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <PageShell>
        <PageHeader title={`Order ${orderId}`} actions={backButton} />
        <Card className="max-w-2xl shadow-card">
          {notFound ? (
            <EmptyState
              title="Order not found"
              description={`No pre-order matches ${orderId}. It may have been deleted.`}
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/">Back to dashboard</Link>
                </Button>
              }
            />
          ) : (
            <ErrorState
              description="We couldn't load this order. Please try again."
              onRetry={() => query.refetch()}
            />
          )}
        </Card>
      </PageShell>
    );
  }

  const order = query.data;
  const busy = statusMutation.isPending || deleteMutation.isPending;
  const closed = order.status === "cancelled";

  return (
    <PageShell>
      <PageHeader
        title={`Order ${order.id}`}
        description={`Placed ${formatFull(order.created_at)} UTC`}
        actions={backButton}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-2">
            <CardTitle className="text-base">Order details</CardTitle>
            <StatusBadge status={order.status} />
          </CardHeader>
          <CardContent>
            <dl>
              <DetailRow label="Customer" value={order.customer_name} />
              <DetailRow label="Pickup time" value={order.pickup_slot} />
              <DetailRow
                label="Flavours"
                value={
                  <ul className="grid gap-1">
                    {order.items.map((item) => (
                      <li key={item.menu_item_id} className="flex justify-between gap-4">
                        <span>{item.item_name}</span>
                        <span className="tabular text-muted-foreground">× {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                }
              />
              <DetailRow
                label="Total items"
                value={<span className="tabular">{order.total_quantity}</span>}
              />
              <DetailRow
                label="Order ID"
                value={<span className="font-mono text-xs">{order.id}</span>}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="h-fit shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Update status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={busy || closed || order.status === "in_progress"}
              onClick={() => statusMutation.mutate("in_progress")}
            >
              Mark as in progress
            </Button>
            <Button
              size="sm"
              disabled={busy || closed || order.status === "completed"}
              onClick={() => statusMutation.mutate("completed")}
            >
              Mark as completed
            </Button>

            <div className="mt-1 border-t border-border pt-3 grid gap-2">
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="outline" disabled={busy || closed}>
                    Cancel order
                  </Button>
                }
                title={`Cancel order ${order.id}?`}
                description={`${order.customer_name} will no longer be expected for pickup. You can still see the order in the list.`}
                confirmLabel="Cancel order"
                cancelLabel="Keep order"
                destructive
                onConfirm={() => statusMutation.mutate("cancelled")}
              />
              <ConfirmDialog
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={busy}
                  >
                    Delete order
                  </Button>
                }
                title={`Delete order ${order.id}?`}
                description="This permanently removes the order and its record from the dashboard. This cannot be undone."
                confirmLabel="Delete permanently"
                cancelLabel="Keep order"
                destructive
                onConfirm={() => deleteMutation.mutate()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
