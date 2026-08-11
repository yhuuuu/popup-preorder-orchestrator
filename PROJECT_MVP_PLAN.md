# PopUp Preorder Orchestrator — MVP Plan

## 1) MVP Goal

Build a small but interview-ready backend project for pop-up food vendors:

- Accept pre-orders
- Create production batches before event day
- Send webhook callbacks to merchant systems
- Handle auth + common integration errors (4xx/5xx)

## 2) MVP Scope (Must Have)

### API Endpoints

1. `POST /api/orders`
   - Create pre-order
   - Required fields: `customer_name`, `item_name`, `quantity`, `pickup_slot`
2. `GET /api/orders`
   - List orders with pagination (`page`, `limit`)
3. `PATCH /api/orders/:id/status`
   - Update order status: `pending`, `confirmed`, `cancelled`, `completed`
4. `POST /api/batches/generate`
   - Group confirmed orders by pickup slot and item
5. `POST /api/webhooks/test`
   - Send test webhook payload to configured callback URL
6. `GET /api/health`
   - Health check

### Core Technical Requirements

- REST + JSON
- Auth via `Authorization: Bearer <token>`
- Basic request validation
- Pagination support
- Webhook delivery with retry (max 3 attempts)
- Error handling for 400/401/404/409/500

## 3) Out of Scope (For Now)

- Frontend UI
- Multi-user roles/permissions
- Real payment integration
- Cloud deployment optimization

## 4) Data Model (MVP)

### orders

- `id` (string/uuid)
- `customer_name`
- `item_name`
- `quantity`
- `pickup_slot`
- `status`
- `created_at`

### batches

- `id`
- `pickup_slot`
- `summary_json` (item totals)
- `created_at`

### webhook_logs

- `id`
- `event_type`
- `target_url`
- `attempt`
- `status_code`
- `success`
- `error_message`
- `created_at`

## 5) Acceptance Criteria

MVP is done when:

1. All 6 endpoints work in Postman.
2. Unauthorized request returns 401.
3. Invalid payload returns 400 with clear message.
4. Non-existing order returns 404.
5. Duplicate/conflicting action returns 409 when appropriate.
6. Webhook test can succeed and can fail/retry 3 times.
7. README includes:
   - Integration diagram
   - Setup steps
   - Postman usage
   - Common errors and fixes

## 6) Build Plan (10 Working Days)

### Phase A — Foundation (Day 1-2)

- Initialize TypeScript + Express project
- Folder structure
- Health endpoint
- Auth middleware

### Phase B — Orders API (Day 3-4)

- Create/list/update order endpoints
- Validation + pagination
- Standard error responses

### Phase C — Batch + Webhook (Day 5-7)

- Batch generation endpoint
- Webhook sender service
- Retry logic + webhook logs

### Phase D — QA + Showcase (Day 8-10)

- Postman collection final
- 4xx/5xx troubleshooting note
- Integration diagram
- README polish

## 7) Daily PM Check-in Template

Copy this daily:

```text
Date:
Today I finished:
Blocked by:
Next step tomorrow:
```

## 8) Risks and Mitigations

- **Risk:** Webhook endpoint unstable  
  **Mitigation:** Use webhook.site first, then local mock receiver.
- **Risk:** Scope creep  
  **Mitigation:** No frontend until MVP acceptance criteria are all green.
- **Risk:** Over-focus on code, under-documentation  
  **Mitigation:** Update README and error note every 2 days.
