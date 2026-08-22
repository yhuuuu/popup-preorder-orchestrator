-- Data-quality checks for the orders and webhook_events tables.
-- Each query returns rows that need investigation.

-- Orders with invalid quantities.
SELECT id, quantity
FROM orders
WHERE quantity < 1 OR quantity > 1000;

-- Orders with missing or incorrectly sized text values.
SELECT id, customer_name, item_name, pickup_slot
FROM orders
WHERE customer_name IS NULL OR length(customer_name) NOT BETWEEN 2 AND 100
   OR item_name IS NULL OR length(item_name) NOT BETWEEN 2 AND 100
   OR pickup_slot IS NULL OR length(pickup_slot) NOT BETWEEN 3 AND 50;

-- Orders with unsupported statuses.
SELECT id, status
FROM orders
WHERE status NOT IN ('pending', 'in_progress', 'completed', 'cancelled');

-- Duplicate orders created for the same customer, item, and pickup slot.
SELECT customer_name, item_name, pickup_slot, COUNT(*) AS duplicate_count
FROM orders
GROUP BY customer_name, item_name, pickup_slot
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
