import express from 'express';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { requestLogger } from './middleware/logger';
import db from './db';
import { PICKUP_SLOTS } from './menu';
import {
  createAuthError,
  createNotFoundError,
  createValidationError,
  createWebhookError,
  validateCreateOrder,
  validateOrderStatusWebhook,
  validateOrderId,
  validateUpdateOrderStatus,
} from './validators';

const app = express();
const PORT = 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'dev-webhook-secret';
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

// Middleware
app.use((req, res, next) => {
  const requestOrigin = req.header('Origin');
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin.replace(/\/$/, ''))) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webhook-secret');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());
app.use(requestLogger);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryAsync<T>(
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

// Attach item lines to a page of orders with a single extra query, rather than
// one query per order.
function attachItems(orders: any[]): any[] {
  if (orders.length === 0) {
    return orders;
  }

  const placeholders = orders.map(() => '?').join(', ');
  const lines = db.prepare(`
    SELECT oi.order_id, oi.menu_item_id, oi.quantity, m.name AS item_name
    FROM order_items oi
    JOIN menu_items m ON m.id = oi.menu_item_id
    WHERE oi.order_id IN (${placeholders})
    ORDER BY oi.id
  `).all(...orders.map((order) => order.id)) as any[];

  const itemsByOrderId = new Map<number, any[]>();
  for (const line of lines) {
    const existing = itemsByOrderId.get(line.order_id);
    const item = {
      menu_item_id: line.menu_item_id,
      item_name: line.item_name,
      quantity: line.quantity,
    };
    if (existing) {
      existing.push(item);
    } else {
      itemsByOrderId.set(line.order_id, [item]);
    }
  }

  return orders.map((order) => {
    const items = itemsByOrderId.get(order.id) ?? [];
    return {
      ...order,
      items,
      total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  });
}

function getOrderWithItems(orderId: number): any | undefined {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  return order ? attachItems([order])[0] : undefined;
}

async function processOrderStatusWebhook(orderId: number, status: string): Promise<any> {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;

  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, orderId);

  return getOrderWithItems(orderId);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timeStamp: new Date().toISOString() });
});

app.get('/api/menu', authMiddleware, (req, res) => {
  const includeUnavailable = req.query.include_unavailable === 'true';

  const menu = db.prepare(`
    SELECT id, name, available
    FROM menu_items
    ${includeUnavailable ? '' : 'WHERE available = 1'}
    ORDER BY name
  `).all() as any[];

  res.json({ menu });
});

app.get('/api/pickup-slots', authMiddleware, (_req, res) => {
  res.json({ pickup_slots: PICKUP_SLOTS });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const start = (page - 1) * limit;

  // Optional filters. These are applied in SQL rather than on the client so
  // that `total` and the pagination stay correct.
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status : '';

  const conditions: string[] = [];
  const params: any[] = [];

  if (search) {
    // Match the customer, or any flavour on the order.
    conditions.push(`(
      o.customer_name LIKE ?
      OR EXISTS (
        SELECT 1 FROM order_items oi
        JOIN menu_items mi ON mi.id = oi.menu_item_id
        WHERE oi.order_id = o.id AND mi.name LIKE ?
      )
    )`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status && status !== 'all') {
    conditions.push('o.status = ?');
    params.push(status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = db
    .prepare(`SELECT COUNT(*) as total FROM orders o ${where}`)
    .get(...params) as { total: number };
  const total = countResult.total;

  const orders = db
    .prepare(`SELECT o.* FROM orders o ${where} ORDER BY o.created_at DESC, o.id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, start) as any[];

  res.json({
    page,
    limit,
    total,
    orders: attachItems(orders),
  });
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const validation = validateOrderId(req.params.id);
  if (!validation.valid || validation.data === undefined) {
    return res.status(400).json(validation.error);
  }

  const order = getOrderWithItems(validation.data);

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
  if (!validation.valid || !validation.data) {
    return res.status(400).json(validation.error);
  }

  const { customer_name, pickup_slot, items } = validation.data;

  // Reject unknown or sold-out flavours before writing anything.
  const menuLookup = db.prepare('SELECT id, name, available FROM menu_items WHERE id = ?');
  for (const item of items) {
    const menuItem = menuLookup.get(item.menu_item_id) as any;

    if (!menuItem) {
      return res.status(400).json(
        createValidationError(`menu_item_id ${item.menu_item_id} does not exist`)
      );
    }

    if (!menuItem.available) {
      return res.status(400).json(
        createValidationError(`"${menuItem.name}" is not currently available`)
      );
    }
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (customer_name, pickup_slot, status)
    VALUES (?, ?, 'pending')
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, quantity)
    VALUES (?, ?, ?)
  `);

  // The order header and its lines must land together; a partial write would
  // leave an order with missing flavours.
  const createOrder = db.transaction(() => {
    const result = insertOrder.run(customer_name, pickup_slot);
    const orderId = Number(result.lastInsertRowid);

    for (const item of items) {
      insertOrderItem.run(orderId, item.menu_item_id, item.quantity);
    }

    return orderId;
  });

  const orderId = createOrder();

  res.status(201).json({
    code: 'ORDER_CREATED',
    message: 'Order created successfully',
    data: getOrderWithItems(orderId),
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
  const updatedOrder = getOrderWithItems(id);

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

  const order = getOrderWithItems(validation.data);

  if (!order) {
    return res.status(404).json(createNotFoundError(`Order with ID ${validation.data} not found`));
  }

  // Preserve webhook history while removing the order relationship.
  // The order's items are removed by ON DELETE CASCADE.
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
