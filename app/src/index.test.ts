import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { app } from './index'

const webhookSecret = 'dev-webhook-secret'
const authHeader = 'Bearer dev-token'

describe('API behavior', () => {
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
        item_name: 'Webhook Test Item',
        quantity: 1,
        pickup_slot: '18:00',
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
        item_name: 'Automated Test Item',
        quantity: 2,
        pickup_slot: '19:00',
      })

    expect(response.status).toBe(201)
    expect(response.body.code).toBe('ORDER_CREATED')
    expect(response.body.data.customer_name).toBe('Automated Test Customer')
    expect(response.body.data.status).toBe('pending')

    await request(app)
      .delete(`/api/orders/${response.body.data.id}`)
      .set('Authorization', authHeader)
  })

  it('rejects an order with a missing customer name', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', authHeader)
      .send({
        item_name: 'Test Item',
        quantity: 1,
        pickup_slot: '19:00',
      })

    expect(response.status).toBe(400)
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
        item_name: 'Status Test Item',
        quantity: 1,
        pickup_slot: '20:00',
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
})
