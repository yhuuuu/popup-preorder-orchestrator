# API Troubleshooting Guide

This guide covers 4 common API failures and how to debug them quickly.

## 1) 401 Unauthorized (missing or invalid API token)

### Reproduce

```bash
curl -i http://localhost:3000/api/orders
```

### Expected response

```text
HTTP/1.1 401 Unauthorized
```

```json
{"message":"Unauthorized: missing Authorization header"}
```

### Quick fix

Send the header with the correct token from `app/.env`:

```bash
curl -i -H "Authorization: Bearer dev-token" http://localhost:3000/api/orders
```

## 2) 404 Not Found (order_id does not exist)

### Reproduce

```bash
curl -i -X POST http://localhost:3000/api/webhooks/order-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: dev-webhook-secret" \
  -d '{"order_id":999999,"status":"completed","source_system":"kitchen"}'
```

### Expected response

```text
HTTP/1.1 404 Not Found
```

```json
{"code":"NOT_FOUND","message":"Order with ID 999999 not found"}
```

### Quick fix

Use a real order ID (create an order first), then resend the webhook.

## 3) 400 Validation Error (bad request body)

### Reproduce

```bash
curl -i -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"A","pickup_slot":"9","items":[{"menu_item_id":1,"quantity":0}]}'
```

### Expected response

```text
HTTP/1.1 400 Bad Request
```

```json
{"code":"VALIDATION_ERROR", "...":"..."}
```

### Quick fix

Send valid values:
- `customer_name`: 2-100 characters
- `pickup_slot`: one of the values from `GET /api/pickup-slots`
- `items`: 1-20 entries, each a distinct `menu_item_id` from `GET /api/menu`
- `items[].quantity`: integer 1-1000

## 4) 503 Webhook processing failed after retries

### Reproduce

First, keep the SQLite database busy in another terminal (for example with a long write transaction).  
Then run:

```bash
curl -i -X POST http://localhost:3000/api/webhooks/order-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: dev-webhook-secret" \
  -d '{"order_id":1,"status":"completed","source_system":"kitchen"}'
```

### Expected response

```text
HTTP/1.1 503 Service Unavailable
```

```json
{
  "code":"WEBHOOK_ERROR",
  "message":"Webhook processing failed after retries"
}
```

### Quick fix

1. Remove the DB lock / restore DB availability.
2. Retry the same webhook request.
3. Check `GET /api/webhooks/events` for `attempt_count` and `last_error`.
