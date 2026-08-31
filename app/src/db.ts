import Database from 'better-sqlite3';
import path from 'path';
import { MENU_ITEMS } from './menu';

// Keep automated test data separate from the local development database.
const dbFileName = process.env.NODE_ENV === 'test' ? 'orders.test.db' : 'orders.db';
const dbPath = path.join(process.cwd(), dbFileName);
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    pickup_slot TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    available INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- One row per flavour in an order, so a customer can mix flavours and give
  -- each its own quantity.
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
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

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  CREATE INDEX IF NOT EXISTS idx_webhook_events_order_id ON webhook_events(order_id);
  CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
`);

const seedMenuItem = db.prepare('INSERT OR IGNORE INTO menu_items (name) VALUES (?)');
db.transaction(() => {
  for (const name of MENU_ITEMS) {
    seedMenuItem.run(name);
  }
})();

// Migrate the original single-item schema, where each order carried one
// `item_name` and `quantity`, into the `order_items` table.
const orderColumns = db.prepare('PRAGMA table_info(orders)').all() as { name: string }[];

if (orderColumns.some((column) => column.name === 'item_name')) {
  db.transaction(() => {
    // Historic orders may reference flavours that were never on the menu.
    // Add them as unavailable so the foreign key holds and history is kept.
    db.prepare(`
      INSERT OR IGNORE INTO menu_items (name, available)
      SELECT DISTINCT item_name, 0 FROM orders
    `).run();

    db.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, quantity)
      SELECT o.id, m.id, o.quantity
      FROM orders o
      JOIN menu_items m ON m.name = o.item_name
    `).run();

    db.exec('ALTER TABLE orders DROP COLUMN item_name');
    db.exec('ALTER TABLE orders DROP COLUMN quantity');
  })();
}

export default db;
