import axios from "axios";

import type {
  CreateOrderInput,
  ListOrdersParams,
  MenuItem,
  Order,
  OrderStatus,
  Paginated,
  WebhookEvent,
} from "./types";

/**
 * Data access layer for the Express API in app/.
 *
 * Every response shape here is dictated by the backend, so change the server
 * first if a field needs to move.
 */
export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] || "http://localhost:3000/api";
const API_TOKEN = import.meta.env["VITE_API_TOKEN"] || "dev-token";

export const DEFAULT_PAGE_SIZE = 10;

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${API_TOKEN}`;
  return config;
});

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// The API reports failures as { code, message }; surface that message rather
// than axios's generic "Request failed with status code 400".
function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      (error.code === "ERR_NETWORK"
        ? "Could not reach the server. Is the API running?"
        : error.message);
    return new ApiError(message, status);
  }
  return new ApiError(error instanceof Error ? error.message : "Unknown error");
}

async function run<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toApiError(error);
  }
}

export const ordersApi = {
  async listOrders(params: ListOrdersParams = {}): Promise<Paginated<Order>> {
    const { search = "", status = "all", page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

    return run(async () => {
      const response = await client.get("/orders", {
        params: {
          page,
          limit: pageSize,
          ...(search.trim() ? { search: search.trim() } : {}),
          ...(status !== "all" ? { status } : {}),
        },
      });

      const { orders = [], total = 0 } = response.data;
      return {
        items: orders as Order[],
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      };
    });
  },

  async getOrder(id: string): Promise<Order> {
    return run(async () => {
      const response = await client.get(`/orders/${id}`);
      return response.data.data as Order;
    });
  },

  async createOrder(input: CreateOrderInput): Promise<Order> {
    return run(async () => {
      const response = await client.post("/orders", input);
      return response.data.data as Order;
    });
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return run(async () => {
      const response = await client.patch(`/orders/${id}/status`, { status });
      return response.data.data as Order;
    });
  },

  async deleteOrder(id: string): Promise<{ id: string }> {
    return run(async () => {
      await client.delete(`/orders/${id}`);
      return { id };
    });
  },

  async listWebhookEvents(): Promise<WebhookEvent[]> {
    return run(async () => {
      const response = await client.get("/webhooks/events", { params: { limit: 50 } });
      return (response.data.events ?? []) as WebhookEvent[];
    });
  },

  async getMenu(): Promise<MenuItem[]> {
    return run(async () => {
      const response = await client.get("/menu");
      return (response.data.menu ?? []) as MenuItem[];
    });
  },

  async getPickupSlots(): Promise<string[]> {
    return run(async () => {
      const response = await client.get("/pickup-slots");
      return (response.data.pickup_slots ?? []) as string[];
    });
  },
};
