import { useEffect, useState } from 'react'
import { CreateOrder } from './pages/CreateOrder'
import { OrderDetail } from './pages/OrderDetail'
import { WebhookEvents } from './pages/WebhookEvent'
import { orderAPI } from './services/api'
import './App.css'

function App() {
  const [page, setPage] = useState('orders')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleHashChange = () => {
      // The hash is our lightweight router: "#/create" becomes "create".
      const hash = window.location.hash.slice(2) || 'orders'
      console.log('Hash changed to:', hash, 'Full hash:', window.location.hash)
      setPage(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    // Only refresh the list while the dashboard is visible.
    // This lets webhook updates appear without a manual browser refresh.
    if (page !== 'orders') return

    fetchOrders()
    const refreshTimer = window.setInterval(fetchOrders, 5000)

    return () => window.clearInterval(refreshTimer)
  }, [page])

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getOrders()
      setOrders(data.orders || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      'pending': '#e8dff2',
      'in_progress': '#d5e8f0',
      'completed': '#d5f0d5',
      'cancelled': '#f0d5d5'
    }
    return colors[status] || '#ddd'
  }

  const getStatusLabel = (status: string) => {
    const labels: any = {
      'pending': 'Pending',
      'in_progress': 'Preparing',
      'completed': 'Ready',
      'cancelled': 'Cancelled'
    }
    return labels[status] || status
  }

  if (page.startsWith('orders/')) {
    // A route such as "orders/1" opens the detail page for order 1.
    const orderId = page.split('/')[1]

    return (
      <OrderDetail
        orderId={orderId}
        onBack={() => {
          window.location.hash = '#/orders'
        }}
      />
    )
  }

  if (page === 'webhooks') {
    // The "webhooks" route opens the webhook events page.
    return (
      <WebhookEvents
        onBack={() => {
          window.location.hash = '#/orders'
        }}
      />
    )
  }

  if (page === 'create') {
    // The "create" route opens the create order page.
    console.log('Rendering CreateOrder page')
    return <CreateOrder onBack={() => {
      console.log('Going back to orders')
      window.location.hash = '#/orders'
    }} />
  }

  return (
    <div style={{
      background: '#f2efe5',
      minHeight: '100vh',
      fontFamily: "'Segoe UI', Roboto, sans-serif",
      paddingBottom: '40px'
    }}>
      {/* Navbar */}
      <div className="orders-header" style={{
        background: 'white',
        padding: '24px 40px',
        borderBottom: '2px solid #2f513a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '700',
          color: '#2f513a'
        }}>
          Pop-up Orders
        </h1>
        <div className="orders-actions">
        <button style={{
          background: '#d6c7e9',
          color: '#2f513a',
          border: 'none',
          padding: '12px 28px',
          borderRadius: '24px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'all 0.3s'
        }}
          onClick={() => {
            console.log('New Order clicked')
            window.location.hash = '#/create'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as any).style.background = '#c9b5dc'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as any).style.background = '#d6c7e9'
          }}>
          + New Order
        </button>

        <button
          style={{
            background: '#ffffff',
            color: '#2f513a',
            border: '1px solid #2f513a',
            padding: '12px 20px',
            borderRadius: '24px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => {
            window.location.hash = '#/webhooks'
          }}
        >
          Webhook events
        </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="orders-content" style={{
        padding: '20px',
        maxWidth: '650px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#2f513a',
          margin: '0 0 6px 0'
        }}>
          Order Board
        </h2>
        <p style={{
          color: '#8b7b8e',
          margin: '0 0 32px 0',
          fontSize: '14px'
        }}>
          {orders.length} orders
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#8b7b8e', padding: '40px' }}>
            Loading...
          </div>
        ) : orders.length > 0 ? (
          <div style={{ display: 'grid', gap: '8px' }}>
            {orders.map((order: any) => (
              <div
                key={order.id}
                className="order-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto auto auto',
                  gap: '12px',
                  alignItems: 'center',
                  background: 'white',
                  borderRadius: '8px',
                  border: '1px solid #e0dbd5',
                  padding: '12px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  window.location.hash = `#/orders/${order.id}`
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as any).style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  (e.currentTarget as any).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as any).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                  (e.currentTarget as any).style.transform = 'translateY(0)';
                }}
              >
                {/* ID Badge */}
                <div style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#2f513a',
                  background: '#d6c7e9',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  minWidth: '40px',
                  textAlign: 'center'
                }}>
                  #{order.id}
                </div>

                {/* Customer + Item */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#2f513a'
                  }}>
                    {order.customer_name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#8b7b8e'
                  }}>
                    {order.item_name}
                  </div>
                </div>

                {/* Qty */}
                <div style={{
                  textAlign: 'center',
                  minWidth: '40px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#8b7b8e',
                    fontWeight: '600'
                  }}>
                    Qty
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#2f513a'
                  }}>
                    {order.quantity}
                  </div>
                </div>

                {/* Pickup */}
                <div style={{
                  textAlign: 'center',
                  minWidth: '50px'
                }}>
                  <div style={{
                    fontSize: '11px',
                    color: '#8b7b8e',
                    fontWeight: '600'
                  }}>
                    Pickup
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#2f513a'
                  }}>
                    {order.pickup_slot}
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  background: getStatusColor(order.status),
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  color: '#2d2d2d',
                  whiteSpace: 'nowrap'
                }}>
                  {getStatusLabel(order.status)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: '2px solid #2f513a'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#2f513a', marginBottom: '8px' }}>
              No orders yet
            </div>
            <div style={{ fontSize: '14px', color: '#8b7b8e' }}>
              Click "New Order" to create one
            </div>

          </div>
        )}
      </div>
    </div>
  )
}

export default App