import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { Order } from "@/lib/orders/types";

export function OrdersTable({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();

  const open = (id: string) => navigate({ to: "/orders/$orderId", params: { orderId: id } });

  return (
    <>
      {/* Desktop / tablet: dense table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 w-[92px]">Order ID</TableHead>
              <TableHead className="h-9">Customer</TableHead>
              <TableHead className="h-9">Item</TableHead>
              <TableHead className="h-9 w-[60px] text-right">Qty</TableHead>
              <TableHead className="h-9 w-[140px]">Pickup time</TableHead>
              <TableHead className="h-9 w-[120px]">Status</TableHead>
              <TableHead className="h-9 w-[90px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                tabIndex={0}
                onClick={() => open(order.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open(order.id);
                  }
                }}
                className="cursor-pointer focus-visible:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
              >
                <TableCell className="py-2 font-mono text-xs tabular text-muted-foreground">
                  {order.id}
                </TableCell>
                <TableCell className="py-2 font-medium">{order.customerName}</TableCell>
                <TableCell className="py-2 text-muted-foreground">{order.itemName}</TableCell>
                <TableCell className="py-2 text-right tabular">{order.quantity}</TableCell>
                <TableCell className="py-2 tabular text-muted-foreground">
                  {formatDateTime(order.pickupTime)}
                </TableCell>
                <TableCell className="py-2">
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="py-2 text-right">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link to="/orders/$orderId" params={{ orderId: order.id }}>
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked compact rows */}
      <ul className="divide-y divide-border md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to="/orders/$orderId"
              params={{ orderId: order.id }}
              className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/60 focus-visible:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{order.customerName}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {order.id}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {order.quantity} × {order.itemName} · {formatDateTime(order.pickupTime)}
                </p>
              </div>
              <StatusBadge status={order.status} className="shrink-0" />
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
