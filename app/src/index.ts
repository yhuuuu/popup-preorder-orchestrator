import express from 'express';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';
import db from './db';
import {
  createAuthError,
  createNotFoundError,
  createWebhookError,
  validateCreateOrder,
  validateOrderStatusWebhook,
  validateOrderId,
  validateUpdateOrderStatus,
} from './validators';

const app = express();
const PORT = 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'dev-webhook-secret';

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(requestLogger);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryAsync<T>(
  operation: () => Promise<T>,
  attempts = 3,
  delayMs = 150,
  shouldRetry: (error: unknown) => boolean = () => true
): Promise<{ result: T; attempts: number }> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await operation();
      return { result, attempts: attempt };
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !shouldRetry(error)) {
        break;
      }

      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('SQLITE_BUSY') || message.includes('database is locked');
}

function insertWebhookEvent(payload: {
  direction: 'inbound' | 'outbound';
  eventType: string;
  orderId: number | null;
  sourceSystem?: string;
  body: unknown;
}): number {
  const result = db.prepare(`
    INSERT INTO webhook_events (direction, event_type, order_id, source_system, payload)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    payload.direction,
    payload.eventType,
    payload.orderId,
    payload.sourceSystem ?? null,
    JSON.stringify(payload.body)
  );

  return Number(result.lastInsertRowid);
}

function updateWebhookEvent(
  id: number,
  status: 'received' | 'processed' | 'failed',
  attemptCount: number,
  lastError?: string
): void {
  db.prepare(`
    UPDATE webhook_events
    SET status = ?, attempt_count = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, attemptCount, lastError ?? null, id);
}

async function processOrderStatusWebhook(orderId: number, status: string): Promise<any> {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;

  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, orderId);

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timeStamp: new Date().toISOString() });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const start = (page - 1) * limit;

  // Fetch total order count
  const countResult = db.prepare('SELECT COUNT(*) as total FROM orders').get() as { total: number };
  const total = countResult.total;

  // Fetch paginated orders
  const orders = db.prepare('SELECT * FROM orders LIMIT ? OFFSET ?').all(limit, start) as any[];

  res.json({
    page,
    limit,
    total,
    orders,
  });
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const validation = validateOrderId(req.params.id);
  if (!validation.valid || validation.data === undefined) {
    return res.status(400).json(validation.error);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(validation.data) as any;

  if (!order) {
    return res.status(404).json(createNotFoundError(`Order with ID ${validation.data} not found`));
  }

  return res.json({
    code: 'ORDER_FOUND',
    message: 'Order retrieved successfully',
    data: order,
  });
});

app.post('/api/orders', authMiddleware, (req, res) => {
  // Validate request body
  const validation = validateCreateOrder(req.body);
  if (!validation.valid) {
    return res.status(400).json(validation.error);
  }

  const { customer_name, item_name, quantity, pickup_slot } = req.body;

  // Insert valid data into database
  const stmt = db.prepare(`
    INSERT INTO orders (customer_name, item_name, quantity, pickup_slot, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);

  const result = stmt.run(customer_name, item_name, quantity, pickup_slot);

  // Fetch the newly created order
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid) as any;

  res.status(201).json({
    code: 'ORDER_CREATED',
    message: 'Order created successfully',
    data: order,
  });
});

app.post('/api/webhooks/order-status', async (req, res) => {
  const webhookSecret = req.header('x-webhook-secret');

  if (webhookSecret !== WEBHOOK_SECRET) {
    return res.status(401).json(createAuthError('Invalid webhook secret'));
  }

  const validation = validateOrderStatusWebhook(req.body);
  if (!validation.valid || !validation.data) {
    return res.status(400).json(validation.error);
  }

  const { order_id, status, source_system } = validation.data;
  const orderExists = db
    .prepare('SELECT 1 FROM orders WHERE id = ?')
    .get(order_id);
  const webhookEventId = insertWebhookEvent({
    direction: 'inbound',
    eventType: 'order.status.update',
    // Keep failed callbacks in the log without violating the order foreign key.
    orderId: orderExists ? order_id : null,
    sourceSystem: source_system,
    body: req.body,
  });

  try {
    const { result: updatedOrder, attempts } = await retryAsync(
      () => processOrderStatusWebhook(order_id, status),
      3,
      150,
      isRetryableError
    );

    updateWebhookEvent(webhookEventId, 'processed', attempts);

    return res.json({
      code: 'WEBHOOK_PROCESSED',
      message: 'Webhook processed successfully',
      data: updatedOrder,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed';

    if (message.includes('not found')) {
      updateWebhookEvent(webhookEventId, 'failed', 1, message);
      return res.status(404).json(createNotFoundError(message));
    }

    updateWebhookEvent(webhookEventId, 'failed', 3, message);

    return res.status(503).json({
      ...createWebhookError('Webhook processing failed after retries'),
      details: {
        error: message,
      },
    });
  }
});

app.get('/api/webhooks/events', authMiddleware, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const events = db.prepare(`
    SELECT *
    FROM webhook_events
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit) as any[];

  res.json({
    limit,
    events,
  });
});

app.patch('/api/orders/:id/status', authMiddleware, (req, res) => {
  const orderId = req.params.id;

  // Validate request parameters and body
  const validation = validateUpdateOrderStatus(orderId, req.body);
  if (!validation.valid) {
    return res.status(400).json(validation.error);
  }

  const id = Number(orderId);
  const { status } = req.body;

  // Check if order exists
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

  if (!order) {
    return res.status(404).json(createNotFoundError(`Order with ID ${id} not found`));
  }

  // Update order status in database
  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, id);

  // Fetch updated order
  const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

  return res.json({
    code: 'ORDER_UPDATED',
    message: 'Order status updated successfully',
    data: updatedOrder,
  });
});

app.delete('/api/orders/:id', authMiddleware, (req, res) => {
  const validation = validateOrderId(req.params.id);
  if (!validation.valid || validation.data === undefined) {
    return res.status(400).json(validation.error);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(validation.data) as any;

  if (!order) {
    return res.status(404).json(createNotFoundError(`Order with ID ${validation.data} not found`));
  }

  // Preserve webhook history while removing the order relationship.
  db.prepare('UPDATE webhook_events SET order_id = NULL WHERE order_id = ?')
    .run(validation.data);
  db.prepare('DELETE FROM orders WHERE id = ?').run(validation.data);

  return res.json({
    code: 'ORDER_DELETED',
    message: 'Order deleted successfully',
    data: order,
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

export { app };

// Start the real HTTP server only when this file is run directly.
// Tests can import `app` without opening another port.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
