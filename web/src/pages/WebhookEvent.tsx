import { useEffect, useState } from 'react'
import { webhookAPI, type WebhookEvent } from '../services/api'

interface WebhookEventsProps {
  onBack: () => void
}

export function WebhookEvents({ onBack }: WebhookEventsProps) {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)

  useEffect(() => {
    const loadEvents = async (showLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true)
        }
        const data = await webhookAPI.getEvents()
        setEvents(data.events || [])
      } catch {
        setError('Failed to load webhook events')
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    }

    // Load immediately, then check for new webhook events every five seconds.
    loadEvents(true)
    const refreshTimer = window.setInterval(() => {
      loadEvents()
    }, 5000)

    return () => window.clearInterval(refreshTimer)
  }, [])

  return (
    <div className="webhook-page" style={{
      minHeight: '100vh',
      background: '#f2efe5',
      padding: '40px',
      color: '#2f513a'
    }}>
      <button onClick={onBack}>← Back to orders</button>

      <main className="webhook-content" style={{
        maxWidth: '900px',
        margin: '40px auto'
      }}>
        <h1>Webhook Events</h1>

        {loading && <p>Loading events...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p>No webhook events yet.</p>
        )}

        {!loading && !error && events.length > 0 && (
          <div style={{
            background: 'white',
            border: '1px solid #e0dbd5',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            {events.map((event) => (
              <div
                key={event.id}
                className="webhook-row"
                onClick={() => {
                  // Clicking the same row closes it; clicking another row opens that event.
                  setExpandedEventId(
                    expandedEventId === event.id ? null : event.id
                  )
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  gap: '16px',
                  padding: '16px',
                  borderBottom: '1px solid #e0dbd5',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <small>Event</small>
                  <div>#{event.id}</div>
                </div>

                <div>
                  <small>Order</small>
                  <div>#{event.order_id}</div>
                </div>

                <div>
                  <small>Attempts</small>
                  <div>{event.attempt_count}</div>
                </div>

                <div>
                  <small>Status</small>
                  <div>{event.status}</div>
                </div>

                {expandedEventId === event.id && (
                  <div style={{
                    gridColumn: '1 / -1',
                    marginTop: '4px',
                    padding: '12px',
                    background: '#f7f4ef',
                    borderRadius: '8px',
                    fontSize: '13px'
                  }}
                  onClick={(clickEvent) => {
                    // Keep copy and text-selection clicks from collapsing the row.
                    clickEvent.stopPropagation()
                  }}>
                    <p>
                      <strong>Status:</strong>{' '}
                      {event.status}
                    </p>

                    <p>
                      <strong>Error:</strong>{' '}
                      {event.last_error || 'None'}
                    </p>

                    <p>
                      <strong>Payload:</strong>
                    </p>

                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      margin: 0
                    }}>
                      {event.payload}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}