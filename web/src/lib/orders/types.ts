export type OrderStatus = "pending" | "preparing" | "ready" | "cancelled";

export interface Order {
  id: string;
  customerName: string;
  itemName: string;
  quantity: number;
  pickupTime: string; // ISO string
  status: OrderStatus;
  createdAt: string;
  notes?: string;
}

export interface CreateOrderInput {
  customerName: string;
  itemName: string;
  quantity: number;
  pickupTime: string;
}

export type WebhookDeliveryStatus = "success" | "failed" | "retrying";

export interface WebhookAttempt {
  attempt: number;
  at: string;
  responseCode: number | null;
  message: string;
}

export interface WebhookEvent {
  id: string;
  orderId: string;
  eventType: string;
  deliveryStatus: WebhookDeliveryStatus;
  attemptCount: number;
  createdAt: string;
  endpoint: string;
  payload: Record<string, unknown>;
  attempts: WebhookAttempt[];
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

export const ORDER_STATUSES: OrderStatus[] = ["pending", "preparing", "ready", "cancelled"];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  cancelled: "Cancelled",
};
