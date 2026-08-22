# Backend Development Log

## Backend Overview
- Express.js REST API with 8 endpoints
- SQLite database with Orders and WebhookEvents tables
- Authentication middleware with Bearer token validation
- Webhook support with retry logic
- Comprehensive error handling and validation

---

## Session: CORS Middleware & API Integration
**Date:** 2026-08-10 17:01-17:15  
**Focus:** Enable cross-origin requests from frontend

### Problems Encountered & Fixes

#### 1. Missing CORS Headers
- **Issue:** Browser blocked fetch from `http://localhost:5173` to `http://localhost:3000`
- **Error:** "Access-Control-Allow-Origin header missing"
- **Root Cause:** Backend had no CORS middleware
- **Fix:** Added CORS middleware in `app/src/index.ts` (lines 18-26):
  ```typescript
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });
  ```
- **Rebuild:** Ran `npm run build` then restarted server

### Changes Made

**app/src/index.ts**
- ✅ Added CORS middleware after `express.json()` (must be before routes)
- ✅ Allows all origins, all HTTP methods, all headers
- ✅ Handles preflight OPTIONS requests
- ✅ Rebuilt TypeScript to dist/

### Current State
- ✅ Backend running on http://localhost:3000
- ✅ CORS headers sent on all responses
- ✅ Frontend can make successful API calls
- ✅ All 8 REST endpoints functional
- ✅ Sample data (6 orders) in SQLite database

### API Endpoints Verified Working
- ✅ GET /api/orders - Returns paginated order list
- ✅ POST /api/orders - Creates new order (used by frontend)
- ✅ GET /api/orders/:id - Get single order
- ✅ PUT /api/orders/:id - Update order status
- ✅ DELETE /api/orders/:id - Delete order
- ✅ POST /api/webhooks/order-status - Webhook receiver with retry
- ✅ GET /api/webhooks/events - View webhook callback logs

### Authentication
- Bearer token required: `Authorization: Bearer dev-token`
- Token configured in `app/.env` via `API_TOKEN=dev-token`
- Frontend passes token via axios interceptor

### Testing Needed
- [ ] Webhook retry mechanism with network failures
- [ ] Error handling for malformed requests
- [ ] Database validation constraints
- [ ] Rate limiting if needed for production

### Historical Issues Resolved (Previous Sessions)

#### Database Setup
- SQLite initialized with Orders and WebhookEvents tables
- Schema includes: id, customer_name, item_name, quantity, pickup_slot, status, created_at, updated_at
- Sample data populated: 6 orders for testing

#### Express Middleware Stack
- express.json() for JSON parsing
- CORS middleware for cross-origin
- requestLogger middleware for request logging
- errorHandler middleware for centralized error handling
- authMiddleware for Bearer token validation on protected routes

#### Error Handling
- Custom error classes: AuthError, NotFoundError, WebhookError, ValidationError
- Centralized error handler returns consistent error format
- Proper HTTP status codes (401, 404, 400, 500)

## Session: Frontend Order Detail Integration
**Date:** 2026-08-21  

### Backend Features Used by the Frontend

- `GET /api/orders/:id` loads one order for the detail page.
- `PUT /api/orders/:id` updates the order status.
- SQLite persists the updated status in `app/orders.db`.
- The frontend confirms persistence by refreshing the detail page.

No backend code changes were required in this session because the existing API and SQLite implementation already supported the detail page.

#### PATCH Request Blocked by CORS
- **Issue:** Updating an order status showed `Failed to update order status`.
- **Root Cause:** The frontend used `PATCH /api/orders/:id/status`, but the backend CORS middleware did not list `PATCH` as an allowed method.
- **Fix:** Added `PATCH` to `Access-Control-Allow-Methods` in `app/src/index.ts`.
- **Verification:** Rebuilt and restarted the backend, then confirmed the browser preflight response included `PATCH`.

#### Invalid Webhook Foreign-Key Error
- **Issue:** Testing a webhook with `order_id: 9999` returned `SQLITE_CONSTRAINT_FOREIGNKEY` instead of a useful `404` response.
- **Root Cause:** The webhook event was inserted with a non-existent `order_id` before the order existence check completed.
- **Fix:** Check whether the order exists before inserting the event. Store `NULL` for the foreign-key field when the order is missing, while keeping the original ID in the payload.
- **Result:** The API returns `404`, and the Webhook Events page records a `failed` event with `attempt_count: 1` and the error message.

## Session: Automated API Tests
**Date:** 2026-08-21  

### Completed

- Added Vitest, Supertest, and TypeScript test types.
- Exported the Express `app` so tests can call routes without opening another port.
- Kept `app.listen()` limited to direct server startup.
- Added `src/index.test.ts`.
- Added tests for:
  - Invalid webhook secret returns `401`.
  - Missing order returns `404`.
  - Valid webhook updates an existing order and returns `200`.
  - Valid order creation returns `201`.
  - Missing customer name returns `400`.
  - Missing order lookup returns `404`.
  - Created order status update returns `200`.
  - Created order deletion returns `200`.
- Added the `npm test` script:

```bash
npm test
```

### Test Result

```text
Test Files: 1 passed
Tests: 7 passed
```

## Session: Repository Integration and Delete Constraint Fix
**Date:** 2026-08-21  

### Nested Git Repository

- **Issue:** The root repository tracked `app/` as a Git link instead of tracking its source files.
- **Impact:** A GitHub checkout and CI workflow could not reliably access the backend source.
- **Fix:** Backed up `app/.git` to `app/.git-backup/`, removed the Git link from the root index, and added the backend files to the main repository.
- **Protection:** Added `app/.git-backup/`, `app/.env`, and `app/orders.db` to the root `.gitignore`.

### Delete Order Foreign-Key Error

- **Issue:** Deleting an order with related webhook events returned `SQLITE_CONSTRAINT_FOREIGNKEY`.
- **Root Cause:** `webhook_events.order_id` referenced the order being deleted.
- **Fix:** Set related webhook event `order_id` values to `NULL` before deleting the order.
- **Design Decision:** Preserve webhook history while removing the deleted order relationship.
- **Verification:** The complete API test suite passes with 7 tests.

### Timestamps
- CORS issue discovered: 2026-08-10 17:02
- CORS fix deployed: 2026-08-10 17:04
- Verified working: 2026-08-10 17:05
