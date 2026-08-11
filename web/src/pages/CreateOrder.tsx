import { useState } from 'react'
import { orderAPI } from '../services/api'

interface CreateOrderProps {
  onBack: () => void
}

export function CreateOrder({ onBack }: CreateOrderProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    item_name: '',
    quantity: 1,
    pickup_slot: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (!formData.customer_name.trim()) {
        setError('Customer name is required')
        setLoading(false)
        return
      }
      if (!formData.item_name.trim()) {
        setError('Item name is required')
        setLoading(false)
        return
      }
      if (formData.quantity < 1) {
        setError('Quantity must be at least 1')
        setLoading(false)
        return
      }
      if (!formData.pickup_slot.trim()) {
        setError('Pickup time is required')
        setLoading(false)
        return
      }

      await orderAPI.createOrder(formData)
      setMessage('Order created successfully!')
      setFormData({
        customer_name: '',
        item_name: '',
        quantity: 1,
        pickup_slot: ''
      })
      setTimeout(() => {
        onBack()
      }, 1000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#f2efe5',
      minHeight: '100vh',
      paddingBottom: '40px'
    }}>
      {/* Navbar */}
      <div style={{
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
        <button
          onClick={() => onBack()}
          style={{
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
          onMouseEnter={(e) => {
            (e.currentTarget as any).style.background = '#c9b5dc'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as any).style.background = '#d6c7e9'
          }}
        >
          ← Back
        </button>
      </div>

      {/* Form Container */}
      <div style={{
        padding: '40px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#2f513a',
          margin: '0 0 8px 0'
        }}>
          Create New Order
        </h2>
        <p style={{
          color: '#8b7b8e',
          margin: '0 0 32px 0',
          fontSize: '14px'
        }}>
          Fill in the details below to create a new order
        </p>

        {error && (
          <div style={{
            background: '#fde8e8',
            border: '1px solid #f0d5d5',
            color: '#c33333',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: '#e8f5e9',
            border: '1px solid #c8e6c9',
            color: '#2e7d32',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          border: '2px solid #2f513a'
        }}>
          {/* Customer Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#8b7b8e',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Customer Name
            </label>
            <input
              type="text"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="Enter customer name"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e8e4db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = '#d6c7e9'
                ;(e.currentTarget as any).style.boxShadow = '0 0 0 3px rgba(214,199,233,0.1)'
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = '#e8e4db'
                ;(e.currentTarget as any).style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Item Name */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#8b7b8e',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Item Name
            </label>
            <input
              type="text"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="e.g., Croissant, Sourdough Bread"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e8e4db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = '#d6c7e9'
                ;(e.currentTarget as any).style.boxShadow = '0 0 0 3px rgba(214,199,233,0.1)'
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = '#e8e4db'
                ;(e.currentTarget as any).style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#8b7b8e',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              max="999"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e8e4db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = '#d6c7e9'
                ;(e.currentTarget as any).style.boxShadow = '0 0 0 3px rgba(214,199,233,0.1)'
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = '#e8e4db'
                ;(e.currentTarget as any).style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Pickup Slot */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#8b7b8e',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Pickup Time
            </label>
            <input
              type="text"
              name="pickup_slot"
              value={formData.pickup_slot}
              onChange={handleChange}
              placeholder="e.g., 2pm, 3:30pm, 10:00am"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e8e4db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                (e.currentTarget as any).style.borderColor = '#d6c7e9'
                ;(e.currentTarget as any).style.boxShadow = '0 0 0 3px rgba(214,199,233,0.1)'
              }}
              onBlur={(e) => {
                (e.currentTarget as any).style.borderColor = '#e8e4db'
                ;(e.currentTarget as any).style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 24px',
              background: loading ? '#ccc' : '#d6c7e9',
              color: '#2f513a',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as any).style.background = '#c9b5dc'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.currentTarget as any).style.background = '#d6c7e9'
              }
            }}
          >
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      </div>
    </div>
  )
}
