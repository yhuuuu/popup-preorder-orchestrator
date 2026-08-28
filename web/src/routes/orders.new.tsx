import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { PageShell } from "@/components/layout/page-shell";
import { OrderForm } from "@/components/orders/order-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ordersApi } from "@/lib/orders/api";
import { orderKeys } from "@/lib/orders/queries";
import type { CreateOrderInput } from "@/lib/orders/types";

export const Route = createFileRoute("/orders/new")({
  head: () => ({
    meta: [
      { title: "New Pre-order — Pop-up Orders" },
      {
        name: "description",
        content: "Add a pop-up pre-order with customer, item, quantity, and pickup time.",
      },
      { property: "og:title", content: "New Pre-order — Pop-up Orders" },
      {
        property: "og:description",
        content: "Add a pop-up pre-order with customer, item, quantity, and pickup time.",
      },
    ],
  }),
  component: CreateOrderPage,
});

function CreateOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateOrderInput) => ordersApi.createOrder(input),
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: orderKeys.all });
      toast.success(`Order ${order.id} created`, {
        description: `${order.quantity} × ${order.itemName} for ${order.customerName}.`,
      });
      navigate({ to: "/" });
    },
    onError: (error: Error) => {
      toast.error("Could not create the order", { description: error.message });
    },
  });

  return (
    <PageShell>
      <PageHeader
        title="New Order"
        description="Log a pre-order for pickup at the stall."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Button>
        }
      />

      <Card className="max-w-2xl shadow-card">
        <CardContent className="pt-0">
          <OrderForm
            submitting={mutation.isPending}
            onSubmit={(input) => mutation.mutate(input)}
            onCancel={() => navigate({ to: "/" })}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
