# SQL Schema Documentation

## Overview

This document describes the database schema for the PopUp Preorder Orchestrator backend. The system uses SQLite as the primary database for persistence.

---

## Tables

### `orders` Table

Stores pre-orders from food vendors' customers.

#### Schema

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  pickup_slot TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
```

#### Column Definitions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique order identifier. Auto-generated sequentially. |
| `customer_name` | TEXT | NOT NULL | Name of the customer placing the order. Validated: 2-100 characters. |
| `item_name` | TEXT | NOT NULL | Name of the item being ordered. Validated: 2-100 characters. |
| `quantity` | INTEGER | NOT NULL | Number of items ordered. Validated: 1-1000. |
| `pickup_slot` | TEXT | NOT NULL | Time slot for order pickup. Validated: 3-50 characters. Format: "HH:MM" or "HH:MM - HH:MM". |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | Order status. Allowed values: `pending`, `in_progress`, `completed`, `cancelled`. |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp when order was created. Auto-set to current time. |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Timestamp of last update. Auto-set to current time on insert and update. |

#### Indexes

- **`idx_orders_status`**
  - Column: `status`
  - Purpose: Speed up queries filtering by status (e.g., "find all pending orders")
  - Use case: Dashboard showing orders by status

#### Sample Data

```sql
INSERT INTO orders (customer_name, item_name, quantity, pickup_slot, status)
VALUES 
  ('Alice Chen', 'Margherita Pizza', 2, '18:00-19:00', 'completed'),
  ('Bob Johnson', 'Pad Thai', 1, '19:30', 'in_progress'),
  ('Carol Smith', 'Chocolate Cake', 3, '17:00', 'pending');
```

---

## API-to-Database Mapping

### POST /api/orders

Inserts a new order with status `pending`.

```sql
INSERT INTO orders (customer_name, item_name, quantity, pickup_slot, status)
VALUES (?, ?, ?, ?, 'pending')
```

### GET /api/orders

Retrieves paginated orders with total count.

```sql
SELECT COUNT(*) as total FROM orders;
SELECT * FROM orders LIMIT ? OFFSET ?;
```

### GET /api/orders/:id

Retrieves a specific order by ID.

```sql
SELECT * FROM orders WHERE id = ?;
```

### PATCH /api/orders/:id/status

Updates an order's status.

```sql
UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;
```

### DELETE /api/orders/:id

Deletes an order and returns the deleted record.

```sql
SELECT * FROM orders WHERE id = ?;
DELETE FROM orders WHERE id = ?;
```

### POST /api/webhooks/order-status

Receives inbound webhook callbacks and updates order status.

```sql
INSERT INTO webhook_events (direction, event_type, order_id, source_system, payload)
VALUES ('inbound', 'order.status.update', ?, ?, ?);

UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;
```

### GET /api/webhooks/events

Returns recent webhook events for troubleshooting.

```sql
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT ?;
```

### `webhook_events` Table

Stores inbound webhook callbacks and retry history.

#### Schema

```sql
CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  direction TEXT NOT NULL DEFAULT 'inbound',
  event_type TEXT NOT NULL,
  order_id INTEGER,
  source_system TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

#### Use Cases

- Store incoming webhook payloads
- Track retry attempts when processing fails temporarily
- Keep a troubleshooting trail for 4xx/5xx debugging

---

## Data Validation Rules

Enforced at application layer before insertion:

### customer_name
- Type: String
- Min length: 2 characters
- Max length: 100 characters
- Restrictions: No SQL injection characters (`;`, `--`, `/*`, `*/`)

### item_name
- Type: String
- Min length: 2 characters
- Max length: 100 characters
- Restrictions: No SQL injection characters

### quantity
- Type: Integer
- Min value: 1
- Max value: 1000

### pickup_slot
- Type: String
- Min length: 3 characters
- Max length: 50 characters
- Format: Free text (e.g., "18:00", "6PM-7PM", "2026-08-06 18:00")

### status
- Type: String
- Allowed values: `pending`, `in_progress`, `completed`, `cancelled`
- Default: `pending` (auto-set on insert)
- Cannot be empty or whitespace-only

---

## Query Patterns

### Retrieve all pending orders
```sql
SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC;
```

### Retrieve orders for a specific day
```sql
SELECT * FROM orders WHERE DATE(created_at) = '2026-08-06';
```

### Count orders by status
```sql
SELECT status, COUNT(*) as count FROM orders GROUP BY status;
```

### Find recently updated orders
```sql
SELECT * FROM orders WHERE updated_at >= datetime('now', '-1 hour');
```

### Retrieve orders with pagination
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10 OFFSET 0;  -- Page 1
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10 OFFSET 10; -- Page 2
```

---

## Performance Considerations

### Index Strategy
- **`idx_orders_status`**: Used for filtering by status (high-cardinality queries)
- Future: Add index on `created_at` if sorting by date becomes common
- Future: Add composite index on `(status, created_at)` for sorted status queries

### Expected Growth
- Current: Single table, < 10K records typical for a small vendor
- Scalability: SQLite sufficient up to ~100K records
- Migration path: PostgreSQL when scaling beyond 1M records

---

## Maintenance

### Backup
```bash
# Copy the SQLite file for backup
cp orders.db orders.db.backup
```

### Restore
```bash
# Restore from backup
cp orders.db.backup orders.db
```

### Reset (Development Only)
```bash
# Delete and recreate database
rm orders.db
# Server will recreate schema on next startup
```

---

## Future Enhancements

1. **Add Webhooks Table**
   - Store webhook callbacks, retry attempts, and error history
   - Link to orders table via foreign key

2. **Add Audit Log Table**
   - Track all status changes with timestamps and user info

3. **Add Customers Table**
   - Normalize customer data (name, email, phone)
   - Link from orders via `customer_id`

4. **Add Items Table**
   - Maintain menu of available items
   - Link from orders via `item_id`

5. **Add Indexes**
   - `idx_orders_created_at` for time-range queries
   - `idx_orders_customer_name` for customer lookups

---

## Related Files

- `sql/schema.sql` - SQL table definitions
- `src/db.ts` - Database connection and initialization
- `src/validators.ts` - Data validation rules
- `src/index.ts` - API routes and queries
