import { useEffect, useState } from 'react'
import { orderAPI, type Order } from '../services/api'

type OrderStatus =
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'cancelled'



interface OrderDetailProps {
    orderId: string
    onBack: () => void
}

export function OrderDetail({ orderId, onBack }: OrderDetailProps) {
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const loadOrder = async () => {
            try {
                // Load the selected order from the API when this page opens.
                const data = await orderAPI.getOrderById(orderId)
                setOrder(data)
            } catch {
                setError('Failed to load order')
            } finally {
                setLoading(false)
            }
        }

        loadOrder()
    }, [orderId])

    const updateStatus = async (status: OrderStatus) => {
        try {
            setSaving(true)
            // Save the new status in the backend, then update the screen
            // with the response returned by the API.
            const updatedOrder = await orderAPI.updateOrderStatus(orderId, status)
            setOrder(updatedOrder)
        } catch {
            setError('Failed to update order status')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteOrder = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this order?'
        )

        if (!confirmed) return

        try {
            setSaving(true)
            await orderAPI.deleteOrder(orderId)
            onBack()
        } catch {
            setError('Failed to delete order')
        } finally {
            setSaving(false)
        }
    }
    if (loading) {
        return <div style={{ padding: '40px' }}>Loading...</div>
    }

    if (error || !order) {
        return (
            <div style={{ padding: '40px' }}>
                <p>{error || 'Order not found'}</p>
                <button onClick={onBack}>Back to orders</button>
            </div>
        )
    }

    return (
        <div className="order-detail-page" style={{
            minHeight: '100vh',
            background: '#f2efe5',
            padding: '40px',
            color: '#2f513a'
        }}>
            <button onClick={onBack}>← Back to orders</button>

            <main style={{
                maxWidth: '650px',
                margin: '40px auto',
                background: 'white',
                padding: '32px',
                borderRadius: '12px',
                border: '1px solid #e0dbd5'
            }}>
                <p>Order #{order.id}</p>
                <h1>{order.customer_name}</h1>

                <p><strong>Pickup:</strong> {order.pickup_slot}</p>
                <p><strong>Status:</strong> {order.status}</p>

                <div style={{ marginTop: '20px' }}>
                    <strong>Items</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                        {order.items?.map((item) => (
                            <li key={item.menu_item_id}>
                                {item.item_name} × {item.quantity}
                            </li>
                        ))}
                    </ul>
                    <p style={{ marginTop: '8px', color: '#8b7b8e' }}>
                        {order.total_quantity} items total
                    </p>
                </div>

                <div className="order-status-actions" style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
                    <button disabled={saving} onClick={() => updateStatus('pending')}>
                        Pending
                    </button>
                    <button disabled={saving} onClick={() => updateStatus('in_progress')}>
                        Preparing
                    </button>
                    <button disabled={saving} onClick={() => updateStatus('completed')}>
                        Ready
                    </button>
                    <button disabled={saving} onClick={() => updateStatus('cancelled')}>
                        Cancel
                    </button>
                </div>

                <button disabled={saving} onClick={handleDeleteOrder}>
                    Delete order
                </button>
            </main>
        </div>
    )
}