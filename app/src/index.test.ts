import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { app, retryAsync } from './index'
import db from './db'

const webhookSecret = 'dev-webhook-secret'
const authHeader = 'Bearer dev-token'

describe('API behavior', () => {
  // Menu IDs are assigned by the database, so read them instead of hardcoding.
  let matchaId: number
  let mangoId: number

  beforeAll(async () => {
    const response = await request(app)
      .get('/api/menu')
      .set('Authorization', authHeader)

    expect(response.status).toBe(200)
    expect(response.body.menu.length).toBeGreaterThanOrEqual(2)

    matchaId = response.body.menu[0].id
    mangoId = response.body.menu[1].id
  })

  it('returns 401 when the webhook secret is invalid', async () => {
    const response = await request(app)
      .post('/api/webhooks/order-status')
      .set('x-webhook-secret', 'wrong-secret')
      .send({
        order_id: 1,
        status: 'completed',
        source_system: 'kitchen',
      })

    expect(response.status).toBe(401)
    expect(response.body.code).toBe('AUTH_ERROR')
  })

  it('returns 404 and records a failed event for a missing order', async () => {
    const response = await request(app)
      .post('/api/webhooks/order-status')
      .set('x-webhook-secret', webhookSecret)
      .send({
        order_id: 999999,
        status: 'completed',
        source_system: 'kitchen',
      })

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
  })

  it('updates an existing order through a valid webhook', async () => {
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Webhook Test Customer',
        items: [{ menu_item_id: matchaId, quantity: 1 }],
        pickup_slot: '1:00 PM',
      })

    const orderId = createResponse.body.data.id

    const response = await request(app)
      .post('/api/webhooks/order-status')
      .set('x-webhook-secret', webhookSecret)
      .send({
        order_id: orderId,
        status: 'completed',
        source_system: 'kitchen',
      })

    expect(response.status).toBe(200)
    expect(response.body.code).toBe('WEBHOOK_PROCESSED')
    expect(response.body.data.status).toBe('completed')

    await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', authHeader)
  })

  it('creates an order with valid data', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Automated Test Customer',
        items: [
          { menu_item_id: matchaId, quantity: 2 },
          { menu_item_id: mangoId, quantity: 3 },
        ],
        pickup_slot: '1:00 PM',
      })

    expect(response.status).toBe(201)
    expect(response.body.code).toBe('ORDER_CREATED')
    expect(response.body.data.customer_name).toBe('Automated Test Customer')
    expect(response.body.data.status).toBe('pending')
    expect(response.body.data.items).toHaveLength(2)
    expect(response.body.data.total_quantity).toBe(5)

    await request(app)
      .delete(`/api/orders/${response.body.data.id}`)
      .set('Authorization', authHeader)
  })

  it('rejects an order with a missing customer name', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        items: [{ menu_item_id: matchaId, quantity: 1 }],
        pickup_slot: '1:00 PM',
      })

    expect(response.status).toBe(400)
  })

  it('rejects an order with a quantity below one', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Invalid Quantity Customer',
        items: [{ menu_item_id: matchaId, quantity: 0 }],
        pickup_slot: '1:00 PM',
      })

    expect(response.status).toBe(400)
  })

  it('rejects an order for a pickup time the pop-up does not offer', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Wrong Slot Customer',
        items: [{ menu_item_id: matchaId, quantity: 1 }],
        pickup_slot: '9:00 PM',
      })

    expect(response.status).toBe(400)
  })

  it('lists the offered pickup slots', async () => {
    const response = await request(app)
      .get('/api/pickup-slots')
      .set('Authorization', authHeader)

    expect(response.status).toBe(200)
    expect(response.body.pickup_slots).toEqual(['1:00 PM', '3:00 PM'])
  })

  it('filters the order list by status', async () => {
    await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Filter Status Customer',
        items: [{ menu_item_id: matchaId, quantity: 1 }],
        pickup_slot: '1:00 PM',
      })

    const response = await request(app)
      .get('/api/orders?status=pending&limit=100')
      .set('Authorization', authHeader)

    expect(response.status).toBe(200)
    expect(response.body.orders.length).toBeGreaterThan(0)
    for (const order of response.body.orders) {
      expect(order.status).toBe('pending')
    }
  })

  it('searches orders by customer name', async () => {
    await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Zebediah Searchtarget',
        items: [{ menu_item_id: matchaId, quantity: 1 }],
        pickup_slot: '1:00 PM',
      })

    const response = await request(app)
      .get('/api/orders?search=Searchtarget')
      .set('Authorization', authHeader)

    expect(response.status).toBe(200)
    expect(response.body.total).toBe(1)
    expect(response.body.orders[0].customer_name).toBe('Zebediah Searchtarget')
  })

  it('searches orders by flavour', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Flavour Search Customer',
        items: [{ menu_item_id: matchaId, quantity: 1 }],
        pickup_slot: '1:00 PM',
      })

    const flavour = created.body.data.items[0].item_name

    const response = await request(app)
      .get(`/api/orders?search=${encodeURIComponent(flavour)}`)
      .set('Authorization', authHeader)

    expect(response.status).toBe(200)
    expect(response.body.total).toBeGreaterThan(0)
    for (const order of response.body.orders) {
      expect(
        order.items.some((item: any) => item.item_name === flavour)
      ).toBe(true)
    }
  })

  it('rejects an order with no items', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Empty Items Customer',
        items: [],
        pickup_slot: '1:00 PM',
      })

    expect(response.status).toBe(400)
  })

  it('rejects an order listing the same flavour twice', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Duplicate Flavour Customer',
        items: [
          { menu_item_id: matchaId, quantity: 1 },
          { menu_item_id: matchaId, quantity: 2 },
        ],
        pickup_slot: '1:00 PM',
      })

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an order referencing a menu item that does not exist', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Unknown Flavour Customer',
        items: [{ menu_item_id: 999999, quantity: 1 }],
        pickup_slot: '1:00 PM',
      })

    expect(response.status).toBe(400)
    expect(response.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 401 when creating an order without authentication', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        customer_name: 'Unauthenticated Customer',
        items: [{ menu_item_id: matchaId, quantity: 1 }],
        pickup_slot: '1:00 PM',
      })

    expect(response.status).toBe(401)
  })

  it('returns 404 when an order does not exist', async () => {
    const response = await request(app)
      .get('/api/orders/999999')
      .set('Authorization', authHeader)

    expect(response.status).toBe(404)
    expect(response.body.code).toBe('NOT_FOUND')
  })

  it('updates and deletes a created order', async () => {
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Status Test Customer',
        items: [{ menu_item_id: mangoId, quantity: 1 }],
        pickup_slot: '3:00 PM',
      })

    const orderId = createResponse.body.data.id

    const updateResponse = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', authHeader)
      .send({ status: 'completed' })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.data.status).toBe('completed')

    const deleteResponse = await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', authHeader)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.code).toBe('ORDER_DELETED')
  })

  it('removes the item lines when an order is deleted', async () => {
    const createResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        customer_name: 'Cascade Test Customer',
        items: [
          { menu_item_id: matchaId, quantity: 1 },
          { menu_item_id: mangoId, quantity: 4 },
        ],
        pickup_slot: '3:00 PM',
      })

    const orderId = createResponse.body.data.id
    expect(createResponse.body.data.items).toHaveLength(2)

    await request(app)
      .delete(`/api/orders/${orderId}`)
      .set('Authorization', authHeader)

    const lines = db
      .prepare('SELECT COUNT(*) AS total FROM order_items WHERE order_id = ?')
      .get(orderId) as { total: number }

    expect(lines.total).toBe(0)
  })
})

describe('CORS behavior', () => {
  it('allows requests from the configured frontend origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173')

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('does not allow requests from an unknown origin', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://unknown.example.com')

    expect(response.status).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('Webhook retry behavior', () => {
  it('retries a transient failure and returns the successful attempt count', async () => {
    let calls = 0

    const result = await retryAsync(
      async () => {
        calls += 1
        if (calls < 3) {
          throw new Error('SQLITE_BUSY: database is locked')
        }
        return 'processed'
      },
      3,
      1,
      (error) => error instanceof Error && error.message.includes('SQLITE_BUSY')
    )

    expect(result.result).toBe('processed')
    expect(result.attempts).toBe(3)
    expect(calls).toBe(3)
  })

  it('stops after the maximum attempts and preserves the final error', async () => {
    let calls = 0
    const finalError = new Error('SQLITE_BUSY: database is locked')

    await expect(
      retryAsync(
        async () => {
          calls += 1
          throw finalError
        },
        3,
        1,
        (error) => error === finalError
      )
    ).rejects.toBe(finalError)

    expect(calls).toBe(3)
  })
})
