// Mirrors the Express API in app/. Field names are snake_case because they come
// straight from the JSON responses; do not rename them without changing the API.

export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface MenuItem {
  id: number;
  name: string;
  available: number;
}

export interface OrderItem {
  menu_item_id: number;
  item_name: string;
  quantity: number;
}

export interface Order {
  id: number;
  customer_name: string;
  pickup_slot: string;
  items: OrderItem[];
  total_quantity: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  customer_name: string;
  pickup_slot: string;
  items: { menu_item_id: number; quantity: number }[];
}

export type WebhookDeliveryStatus = "received" | "processed" | "failed";

export interface WebhookEvent {
  id: number;
  direction: string;
  event_type: string;
  order_id: number | null;
  source_system: string | null;
  payload: string;
  status: WebhookDeliveryStatus;
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListOrdersParams {
  search?: string;
  status?: OrderStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const ORDER_STATUSES: OrderStatus[] = ["pending", "in_progress", "completed", "cancelled"];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

// A one-line summary of an order's flavours, e.g. "Matcha banana x 2, Lychee rose x 1".
export function summarizeItems(items: OrderItem[]): string {
  if (!items?.length) return "No items";
  return items.map((item) => `${item.item_name} × ${item.quantity}`).join(", ");
}
