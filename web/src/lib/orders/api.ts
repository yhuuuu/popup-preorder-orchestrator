import { mockOrders, mockWebhookEvents } from "./mock-data";
import type {
  CreateOrderInput,
  ListOrdersParams,
  Order,
  OrderStatus,
  Paginated,
  WebhookEvent,
} from "./types";

/**
 * Data access layer.
 *
 * Currently backed by in-memory mock data. To connect a REST backend, replace
 * the bodies below with fetch calls against API_BASE_URL and keep the same
 * signatures — nothing in the UI needs to change.
 *
 *   const res = await fetch(`${API_BASE_URL}/orders`, { headers: authHeaders() })
 *
 * Endpoints:
 *   GET    /orders
 *   POST   /orders
 *   GET    /orders/:id
 *   PUT    /orders/:id
 *   DELETE /orders/:id
 *   GET    /webhooks/events
 */
export const API_BASE_URL = "http://localhost:3000/api";

export const DEFAULT_PAGE_SIZE = 10;

const LATENCY = 320;

let orders: Order[] = [...mockOrders];
const webhookEvents: WebhookEvent[] = [...mockWebhookEvents];

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY));
}

function sortByPickup(list: Order[]) {
  return [...list].sort((a, b) => a.pickupTime.localeCompare(b.pickupTime));
}

export const ordersApi = {
  async listOrders(params: ListOrdersParams = {}): Promise<Paginated<Order>> {
    const { search = "", status = "all", page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
    const term = search.trim().toLowerCase();

    const filtered = sortByPickup(orders).filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesSearch =
        !term ||
        order.id.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term) ||
        order.itemName.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });

    const end = page * pageSize;
    return delay({
      items: filtered.slice(0, end),
      total: filtered.length,
      page,
      pageSize,
      hasMore: end < filtered.length,
    });
  },

  async getOrder(id: string): Promise<Order> {
    const order = orders.find((o) => o.id === id);
    if (!order) throw new ApiError(`Order ${id} was not found.`, 404);
    return delay(order);
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const maxId = orders.reduce((max, o) => {
      const n = Number(o.id.replace(/\D/g, ""));
      return Number.isFinite(n) && n > max ? n : max;
    }, 1000);

    const order: Order = {
      id: `PO-${maxId + 1}`,
      customerName: input.customerName.trim(),
      itemName: input.itemName.trim(),
      quantity: input.quantity,
      pickupTime: new Date(input.pickupTime).toISOString(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    orders = [order, ...orders];
    return delay(order);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = orders.find((o) => o.id === id);
    if (!order) throw new ApiError(`Order ${id} was not found.`, 404);
    const updated: Order = { ...order, status };
    orders = orders.map((o) => (o.id === id ? updated : o));
    return delay(updated);
  },

  async deleteOrder(id: string): Promise<{ id: string }> {
    if (!orders.some((o) => o.id === id)) throw new ApiError(`Order ${id} was not found.`, 404);
    orders = orders.filter((o) => o.id !== id);
    return delay({ id });
  },

  async listWebhookEvents(): Promise<WebhookEvent[]> {
    return delay([...webhookEvents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
};
