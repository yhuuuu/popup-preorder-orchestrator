import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || 'dev-token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  config.headers.Authorization = 'Bearer ' + API_TOKEN;
  return config;
});

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
  id: string;
  customer_name: string;
  pickup_slot: string;
  items: OrderItem[];
  total_quantity: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  customer_name: string;
  pickup_slot: string;
  items: { menu_item_id: number; quantity: number }[];
}

export interface WebhookEvent {
  id: string;
  order_id: string;
  payload: string;
  status: 'received' | 'processed' | 'failed';
  attempt_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export const orderAPI = {
  getOrders: async (page: number = 1, limit: number = 10) => {
    const response = await apiClient.get('/orders', { params: { page, limit } });
    return response.data;
  },

  getOrderById: async (id: string) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data.data;
  },

  createOrder: async (order: CreateOrderInput) => {
    const response = await apiClient.post('/orders', order);
    return response.data.data;
  },

  updateOrderStatus: async (id: string, status: Order['status']) => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return response.data.data;
  },

  deleteOrder: async (id: string) => {
    const response = await apiClient.delete(`/orders/${id}`);
    return response.data.data;
  },
};

export const menuAPI = {
  getMenu: async (): Promise<MenuItem[]> => {
    const response = await apiClient.get('/menu');
    return response.data.menu || [];
  },

  getPickupSlots: async (): Promise<string[]> => {
    const response = await apiClient.get('/pickup-slots');
    return response.data.pickup_slots || [];
  },
};

export const webhookAPI = {
  getEvents: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get('/webhooks/events', { params: { page, limit } });
    return response.data;
  },
};
