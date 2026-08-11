import { useState, useEffect } from 'react';
import { orderAPI, type Order } from '../services/api';
import '../styles/OrderList.css';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await orderAPI.getOrders(page, pagination.limit);
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    try {
      setUpdatingId(id);
      await orderAPI.updateOrderStatus(id, newStatus);
      fetchOrders(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      setUpdatingId(id);
      await orderAPI.deleteOrder(id);
      fetchOrders(pagination.page);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete order');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="order-list-container">
        <div className="loading-container">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="order-list-container">
      <div className="order-list-header">
        <h1>✨ Order Board</h1>
        <button className="btn btn-primary" onClick={() => window.location.href = '/#/create'}>
          + New Order
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <h2>No orders yet</h2>
          <p>Create your first order to get started</p>
        </div>
      ) : (
        <>
          <div className="order-list-table-wrapper">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="card-header">
                  <div className="card-id">#{order.id.slice(0, 8)}</div>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </div>

                <div className="card-field">
                  <div className="card-label">Customer</div>
                  <div className="card-value large">{order.customer_name}</div>
                </div>

                <div className="card-divider"></div>

                <div className="card-field">
                  <div className="card-label">Item</div>
                  <div className="card-value">{order.item_name}</div>
                </div>

                <div className="card-field">
                  <div className="card-label">Quantity</div>
                  <div className="card-value">{order.quantity}</div>
                </div>

                <div className="card-field">
                  <div className="card-label">Pickup Slot</div>
                  <div className="card-value">{order.pickup_slot}</div>
                </div>

                <div className="card-field">
                  <div className="card-label">Created</div>
                  <div className="card-value small">{new Date(order.created_at).toLocaleString()}</div>
                </div>

                <div className="card-divider"></div>

                <div className="card-actions">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                    disabled={updatingId === order.id}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(order.id)}
                    disabled={updatingId === order.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination">
            <button
              onClick={() => fetchOrders(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="btn btn-primary btn-sm"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {pagination.page} of {pagination.total_pages} ({pagination.total} total)
            </span>
            <button
              onClick={() => fetchOrders(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages || loading}
              className="btn btn-primary btn-sm"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
