import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { OrderFilters, type StatusFilter } from "@/components/orders/order-filters";
import { OrdersTable } from "@/components/orders/orders-table";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/orders/states";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEFAULT_PAGE_SIZE } from "@/lib/orders/api";
import { ordersListQuery } from "@/lib/orders/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pop-up Orders — Pre-order Dashboard" },
      {
        name: "description",
        content:
          "Track pop-up bakery pre-orders: search, filter by status, and manage pickups from one compact dashboard.",
      },
      { property: "og:title", content: "Pop-up Orders — Pre-order Dashboard" },
      {
        property: "og:description",
        content: "Search, filter, and manage pop-up food vendor pre-orders in one place.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const query = useQuery(ordersListQuery({ search, status, page, pageSize: DEFAULT_PAGE_SIZE }));

  const orders = query.data?.items ?? [];
  const hasFilters = search.trim().length > 0 || status !== "all";

  return (
    <PageShell>
      <PageHeader
        title="Pop-up Orders"
        description="Pre-orders for the weekend market stall."
        actions={
          <Button asChild size="sm">
            <Link to="/orders/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Order
            </Link>
          </Button>
        }
      />

      <OrderFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        {...(query.data ? { resultCount: query.data.total } : {})}
      />

      <Card className="overflow-hidden py-0 shadow-card">
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <ErrorState
            description="We couldn't load the order list. Check your connection and try again."
            onRetry={() => query.refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            title={hasFilters ? "No matching orders" : "No orders yet"}
            description={
              hasFilters
                ? "Try a different search term or clear the status filter."
                : "Create your first pre-order to see it listed here."
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button asChild size="sm">
                  <Link to="/orders/new">New Order</Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            <OrdersTable orders={orders} />
            <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2.5">
              <p className="text-xs text-muted-foreground">
                Showing {orders.length} of {query.data?.total ?? orders.length}
              </p>
              {query.data?.hasMore ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs"
                  disabled={query.isFetching}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  {query.isFetching ? "Loading…" : "Load more"}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}
