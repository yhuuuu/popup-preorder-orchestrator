import { useEffect, useState } from 'react'
import { menuAPI, orderAPI, type MenuItem } from '../services/api'

interface CreateOrderProps {
  onBack: () => void
}

interface ItemRow {
  menu_item_id: number | ''
  quantity: number
}

export function CreateOrder({ onBack }: CreateOrderProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    pickup_slot: ''
  })
  const [menu, setMenu] = useState<MenuItem[]>([])
  const [pickupSlots, setPickupSlots] = useState<string[]>([])
  const [menuError, setMenuError] = useState('')
  const [itemRows, setItemRows] = useState<ItemRow[]>([{ menu_item_id: '', quantity: 1 }])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [menuItems, slots] = await Promise.all([
          menuAPI.getMenu(),
          menuAPI.getPickupSlots(),
        ])
        setMenu(menuItems)
        setPickupSlots(slots)
      } catch {
        setMenuError('Could not load the menu. Check that the API is running.')
      }
    }

    loadOptions()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const updateRow = (index: number, changes: Partial<ItemRow>) => {
    setItemRows(prev => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)))
  }

  const addRow = () => {
    setItemRows(prev => [...prev, { menu_item_id: '', quantity: 1 }])
  }

  const removeRow = (index: number) => {
    setItemRows(prev => prev.filter((_, i) => i !== index))
  }

  // Flavours already chosen are hidden from the other dropdowns, because the
  // API rejects an order that lists the same flavour on two lines.
  const availableOptions = (index: number) => {
    const takenIds = itemRows
      .filter((_, i) => i !== index)
      .map(row => row.menu_item_id)

    return menu.filter(item => !takenIds.includes(item.id))
  }

  const totalQuantity = itemRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)

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
      if (!formData.pickup_slot.trim()) {
        setError('Pickup time is required')
        setLoading(false)
        return
      }

      const chosenRows = itemRows.filter(row => row.menu_item_id !== '')
      if (chosenRows.length === 0) {
        setError('Choose at least one flavour')
        setLoading(false)
        return
      }
      if (chosenRows.some(row => Number(row.quantity) < 1)) {
        setError('Every quantity must be at least 1')
        setLoading(false)
        return
      }

      await orderAPI.createOrder({
        customer_name: formData.customer_name,
        pickup_slot: formData.pickup_slot,
        items: chosenRows.map(row => ({
          menu_item_id: Number(row.menu_item_id),
          quantity: Number(row.quantity)
        }))
      })

      setMessage('Order created successfully!')
      setFormData({ customer_name: '', pickup_slot: '' })
      setItemRows([{ menu_item_id: '', quantity: 1 }])
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
    <div className="create-order-page" style={{
      background: '#f2efe5',
      minHeight: '100vh',
      paddingBottom: '40px'
    }}>
      {/* Navbar */}
      <div className="create-order-header" style={{
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
      <div className="create-order-content" style={{
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

        <form className="create-order-form" onSubmit={handleSubmit} style={{
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

          {/* Flavours */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              color: '#8b7b8e',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Flavours
            </label>

            {menuError && (
              <div style={{
                background: '#fde8e8',
                border: '1px solid #f0d5d5',
                color: '#c33333',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '12px',
                fontSize: '13px'
              }}>
                {menuError}
              </div>
            )}

            {itemRows.map((row, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <select
                  value={row.menu_item_id}
                  onChange={(e) => updateRow(index, {
                    menu_item_id: e.target.value === '' ? '' : Number(e.target.value)
                  })}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: '12px 16px',
                    border: '1px solid #e8e4db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="">Select a flavour…</option>
                  {availableOptions(index).map((menuItem) => (
                    <option key={menuItem.id} value={menuItem.id}>
                      {menuItem.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  aria-label="Quantity"
                  value={row.quantity}
                  onChange={(e) => updateRow(index, { quantity: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="999"
                  style={{
                    width: '84px',
                    padding: '12px',
                    border: '1px solid #e8e4db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />

                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  disabled={itemRows.length === 1}
                  title="Remove this flavour"
                  style={{
                    padding: '12px 14px',
                    border: '1px solid #e8e4db',
                    borderRadius: '8px',
                    background: 'white',
                    color: itemRows.length === 1 ? '#ccc' : '#c33333',
                    cursor: itemRows.length === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '700'
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px'
            }}>
              <button
                type="button"
                onClick={addRow}
                disabled={itemRows.length >= menu.length && menu.length > 0}
                style={{
                  background: 'transparent',
                  color: '#2f513a',
                  border: '1px dashed #2f513a',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontWeight: '600',
                  cursor: itemRows.length >= menu.length && menu.length > 0 ? 'not-allowed' : 'pointer',
                  fontSize: '13px'
                }}
              >
                + Add another flavour
              </button>
              <span style={{ fontSize: '13px', color: '#8b7b8e' }}>
                {totalQuantity} total
              </span>
            </div>
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
            <select
              name="pickup_slot"
              value={formData.pickup_slot}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #e8e4db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                background: 'white',
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select a pickup time…</option>
              {pickupSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
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
