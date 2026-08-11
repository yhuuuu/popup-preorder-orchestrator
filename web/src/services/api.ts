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

export interface Order {
  id: string;
  customer_name: string;
  item_name: string;
  quantity: number;
  pickup_slot: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  order_id: string;
  payload: string;
  attempt: number;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
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

  createOrder: async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
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

export const webhookAPI = {
  getEvents: async (page: number = 1, limit: number = 20) => {
    const response = await apiClient.get('/webhooks/events', { params: { page, limit } });
    return response.data;
  },
};
