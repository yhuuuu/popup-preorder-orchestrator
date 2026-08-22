import Database from 'better-sqlite3';
import path from 'path';

// Keep automated test data separate from the local development database.
const dbFileName = process.env.NODE_ENV === 'test' ? 'orders.test.db' : 'orders.db';
const dbPath = path.join(process.cwd(), dbFileName);
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    pickup_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS webhook_events (
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

  CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON webhook_events(order_id);
  CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
`);

export default db;
