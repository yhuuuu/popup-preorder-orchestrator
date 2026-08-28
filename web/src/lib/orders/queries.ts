import { queryOptions } from "@tanstack/react-query";

import { ordersApi } from "./api";
import type { ListOrdersParams } from "./types";

export const orderKeys = {
  all: ["orders"] as const,
  list: (params: ListOrdersParams) => ["orders", "list", params] as const,
  detail: (id: string) => ["orders", "detail", id] as const,
  webhookEvents: ["webhook-events"] as const,
};

export const ordersListQuery = (params: ListOrdersParams) =>
  queryOptions({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.listOrders(params),
  });

export const orderDetailQuery = (id: string) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getOrder(id),
    retry: false,
  });

export const webhookEventsQuery = () =>
  queryOptions({
    queryKey: orderKeys.webhookEvents,
    queryFn: () => ordersApi.listWebhookEvents(),
  });

export const menuQuery = () =>
  queryOptions({
    queryKey: ["menu"] as const,
    queryFn: () => ordersApi.getMenu(),
    staleTime: 5 * 60 * 1000,
  });

export const pickupSlotsQuery = () =>
  queryOptions({
    queryKey: ["pickup-slots"] as const,
    queryFn: () => ordersApi.getPickupSlots(),
    staleTime: 5 * 60 * 1000,
  });
