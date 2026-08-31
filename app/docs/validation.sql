-- Data-quality checks for the orders, order_items, and webhook_events tables.
-- Each query returns rows that need investigation.

-- Order lines with invalid quantities.
SELECT order_items.id, order_items.order_id, order_items.quantity
FROM order_items
WHERE order_items.quantity < 1 OR order_items.quantity > 1000;

-- Orders with missing or incorrectly sized text values.
SELECT id, customer_name, pickup_slot
FROM orders
WHERE customer_name IS NULL OR length(customer_name) NOT BETWEEN 2 AND 100
   OR pickup_slot IS NULL OR length(pickup_slot) NOT BETWEEN 3 AND 50;

-- Orders with unsupported statuses.
SELECT id, status
FROM orders
WHERE status NOT IN ('pending', 'in_progress', 'completed', 'cancelled');

-- Orders with no flavours at all. The API rejects these, so any row here was
-- written outside the application.
SELECT orders.id, orders.customer_name
FROM orders
LEFT JOIN order_items ON order_items.order_id = orders.id
WHERE order_items.id IS NULL;

-- The same flavour listed twice on one order; quantities should be merged.
SELECT order_id, menu_item_id, COUNT(*) AS line_count
FROM order_items
GROUP BY order_id, menu_item_id
HAVING COUNT(*) > 1;

-- Order lines pointing at a menu item that no longer exists.
SELECT order_items.id, order_items.order_id, order_items.menu_item_id
FROM order_items
LEFT JOIN menu_items ON menu_items.id = order_items.menu_item_id
WHERE menu_items.id IS NULL;

-- Orphaned order lines whose parent order is gone. The cascade should prevent
-- these, so any row here means foreign keys were off during a delete.
SELECT order_items.id, order_items.order_id
FROM order_items
LEFT JOIN orders ON orders.id = order_items.order_id
WHERE orders.id IS NULL;

-- Duplicate orders created for the same customer and pickup slot.
SELECT customer_name, pickup_slot, COUNT(*) AS duplicate_count
FROM orders
GROUP BY customer_name, pickup_slot
HAVING COUNT(*) > 1;

-- Webhook events whose order reference no longer exists.
SELECT webhook_events.id, webhook_events.order_id
FROM webhook_events
LEFT JOIN orders ON orders.id = webhook_events.order_id
WHERE webhook_events.order_id IS NOT NULL
  AND orders.id IS NULL;

-- Failed webhook events missing an explanation.
SELECT id, status, last_error
FROM webhook_events
WHERE status = 'failed' AND (last_error IS NULL OR length(last_error) = 0);
