# Webhook Testing Guide

The webhook endpoint accepts order status updates from an external system:

```text
POST http://localhost:3000/api/webhooks/order-status
```

Start the backend before running these commands:

```bash
npm start
```

Run the commands from the `app` directory.

## 1. Successful webhook

This updates order `1` to `completed` and creates a processed webhook event.

```bash
curl -X POST http://localhost:3000/api/webhooks/order-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: dev-webhook-secret" \
  -d '{"order_id":1,"status":"completed","source_system":"kitchen"}'
```

Expected result:

```json
{
  "code": "WEBHOOK_PROCESSED",
  "message": "Webhook processed successfully"
}
```

Verify the result by refreshing the order detail page and the Webhook Events page.

## 2. Non-existent order

This tests not-found handling and failed event logging.

```bash
curl -X POST http://localhost:3000/api/webhooks/order-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: dev-webhook-secret" \
  -d '{"order_id":9999,"status":"completed","source_system":"kitchen"}'
```

Expected result:

```json
{
  "code": "NOT_FOUND",
  "message": "Order with ID 9999 not found"
}
```

The Webhook Events page should show:

```text
status: failed
attempt_count: 1
last_error: Order with ID 9999 not found
```

## 3. Invalid webhook secret

This tests authentication. The request must be rejected before the webhook is processed.

```bash
curl -X POST http://localhost:3000/api/webhooks/order-status \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: wrong-secret" \
  -d '{"order_id":1,"status":"completed","source_system":"kitchen"}'
```

Expected result:

```json
{
  "code": "AUTH_ERROR",
  "message": "Invalid webhook secret"
}
```

The order status and webhook event history should not change.

## What to remember

You do not need to memorize the complete `curl` command. Check:

1. The HTTP method and endpoint.
2. Required headers and authentication.
3. The JSON request body.
4. The expected status and response code.
