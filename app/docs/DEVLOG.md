# Developer Log — PopUp Preorder Orchestrator

---

## 2026-08-03 | Day 1 — Project Initialization

**Status:** ✅ Complete

### What Was Completed
- Initialized Node.js + TypeScript project
- Installed Express, tsx, nodemon, TypeScript toolchain
- Created project folder structure (`src/routes`, `controllers`, `services`, `middleware`)
- Implemented `GET /api/health` endpoint
- Verified response via curl and Thunder Client

### Technical Decisions
| Decision | Reason |
|----------|--------|
| Used `tsx` instead of `ts-node` | `ts-node` incompatible with Node v25 |
| Set `"module": "CommonJS"` in tsconfig | Required for Node.js backend (not frontend) |

### Issues Encountered & Resolved
| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Server crash on start | `ts-node` not compatible with Node v25 | Replaced with `tsx` |
| 404 on `/api/health` | Route defined as `/health` missing `/api` prefix | Updated route path |

### Next Session
- Implement Bearer token auth middleware
- Build `POST /api/orders` endpoint

────────────────────

## 2026-08-04 | Express Request Flow Reference

**Status:** Reference Note



### Short Summary
- Request comes in first.
- Middleware checks auth.
- `next()` passes control to the route handler.
- The handler uses the same `req` and `res` objects to return data.

────────────────────

## 2026-08-04 | Orders API Progress

**Status:** In Progress

### What Was Completed
- Built `POST /api/orders`
- Built `GET /api/orders`
- Added auth middleware with Bearer token check
- Added in-memory `orders` array
- Added pagination using `page` and `limit` query params
- Verified endpoints in Thunder Client

### Technical Concepts Learned
- Middleware checks requests before route handlers run
- `next()` passes control to the next function in the request chain
- `req` holds request data and `res` sends the response
- `req` and `res` are created once by Express and passed through middleware and route handlers for the same request
- Auth middleware acts as a gatekeeper by checking `Authorization` before the route handler runs
- Route handlers do the business work after auth passes

### Mental Model （Express Request Flow Reference）
```text
Client / Thunder Client
        |
        |  GET /api/orders
        |  Authorization: Bearer dev-token
        v
Express app receives the request
        |
        |  Express creates:
        |  req = 请求信息
        |  res = 响应工具
        v
app.get('/api/orders', authMiddleware, (req, res) => { ... })
        |
         v
 authMiddleware(req, res, next)
        |
        |  1. req.header('Authorization')
        |  2. split into "Bearer" + token
        |  3. compare token with API_TOKEN
        |
        +---- fail ----> res.status(401).json(...)
        |
        +---- pass ----> next()
                        |
                        v
                route handler: (req, res) => { ... }
                        |
                        |  use req if needed
                        |  use res to send data
                        v
                res.json({ order: [] })
                        |
                        v
                Response goes back to client
```



### Pagination Logic Learned
- Pagination means splitting one long list into smaller pages
- `page` means which chunk of data to return
- `limit` means how many items to return per page
- `start = (page - 1) * limit` converts page number into the correct array index
- `end = start + limit` marks where that page should stop
- `orders.slice(start, end)` returns only the items for that page
- `slice` does not include the end index, so `slice(4, 8)` returns indexes 4, 5, 6, and 7, which maps to orders 5–8
- array indexes start at 0, so the 5th order is at index 4

### Pagination Example
```text
orders = [o1, o2, o3, o4, o5, o6, o7, o8]

page = 2
limit = 4

start = (2 - 1) * 4 = 4
end = 4 + 4 = 8

orders.slice(4, 8) -> [o5, o6, o7, o8]
```

### Issues Encountered & Resolved
- Fixed missing `/` in the `/api/orders` route, which caused a 404 because Express requires exact path matching
- Fixed the Thunder Client URL hostname error by using `http://localhost:3000/api/orders`
- Learned that in-memory data stored in an array resets when nodemon restarts the server
- Learned that `slice(start, end)` excludes the `end` index, which matters when testing pagination
- Learned that route handlers and middleware share the same `req` and `res` objects for one request

### Next Session
- Build `PATCH /api/orders/:id/status`
- Add status validation for order updates

────────────────────

## 2026-08-05 | PATCH Status Update API

**Status:** ✅ Complete

### What Was Completed
- Added `id` and `status` fields to order schema
- Built `PATCH /api/orders/:id/status` endpoint
- Added status validation (allowed: `pending`, `in_progress`, `completed`, `cancelled`)
- Implemented 404 for non-existent orders
- Implemented 400 for invalid statuses
- Verified full workflow: POST → GET → PATCH in Thunder Client

### Technical Concepts Learned
- **Array `find()` method:**
  - `orders.find((order) => order.id === orderId)` loops through array and returns first match
  - The `order` parameter in callback is automatically provided by `find()` for each element
  - Returns the matched object or `undefined` if not found
  
- **HTTP Method Semantics:**
  - PATCH = update part of a resource (just status field)
  - PUT = replace entire resource (less common for partial updates)
  
- **URL Path Params vs Query Params:**
  - Path params (`/api/orders/:id`) = identify one specific resource
  - Query params (`?page=2&limit=10`) = control how to list/filter
  - JSON body = send data for create/update operations

- **ID Generation Strategy:**
  - Used `orders.length + 1` to auto-generate simple IDs
  - Works for in-memory storage but needs UUID/database ID for production

### Example Workflow Tested
```
1. POST /api/orders with JSON body
   → Returns order with id: 1, status: "pending"

2. PATCH /api/orders/1/status with JSON body { "status": "completed" }
   → Returns updated order with status: "completed"
```

### Next Session
- Add SQL database for data persistence
- Write SQL schema and migration docs
- Replace in-memory array with database queries

────────────────────

## 2026-08-06 | Webhook Callback, Retry, and Troubleshooting

**Status:** ✅ Complete

### What Was Completed
- Added `POST /api/webhooks/order-status` to receive inbound webhook callbacks
- Added `GET /api/webhooks/events` for webhook troubleshooting
- Added `webhook_events` table to store payloads and retry history
- Added retry logic for temporary webhook processing failures
- Validated webhook requests with a shared secret header

### Technical Concepts Learned
- Webhooks are event-driven callbacks: another system calls your API when something happens
- Retry logic should only repeat temporary failures, not permanent ones like "not found"
- Logging webhook payloads makes 4xx/5xx debugging much easier

### Next Session
- Add GET /api/orders/:id endpoint
- Add DELETE /api/orders/:id endpoint

────────────────────

## 2026-08-07 | Order Detail and Delete Routes

**Status:** ✅ Complete

### What Was Completed
- Added `GET /api/orders/:id` to fetch one order by ID
- Added `DELETE /api/orders/:id` to remove one order
- Reused shared order ID validation logic
- Updated SQL schema documentation for the new routes

### Technical Concepts Learned
- Path params identify a single resource
- GET returns the current record, DELETE removes it
- Shared validators reduce duplicated route logic

### Next Session
- Add any remaining reporting or workflow routes if needed

────────────────────

## 2026-08-06 | SQLite Database Integration

**Status:** ✅ Complete

### What Was Completed
- Installed `better-sqlite3` driver for Node.js
- Created `src/db.ts` module for database connection and initialization
- Created `sql/schema.sql` with orders table definition
- Replaced in-memory `orders` array with SQLite queries
- Updated all CRUD operations:
  - `POST /api/orders` → `INSERT INTO orders`
  - `GET /api/orders` → `SELECT * FROM orders LIMIT ? OFFSET ?`
  - `PATCH /api/orders/:id/status` → `UPDATE orders SET status`
- Added `created_at` and `updated_at` timestamps
- Added index on `status` column for faster queries
- Verified all endpoints work with Thunder Client

### Technical Concepts Learned
- **`db.prepare()` = prepare SQL statement with placeholders**
  - `?` = parameter placeholder (safe from SQL injection)
  - `.run(data)` = execute INSERT/UPDATE/DELETE
  - `.get(id)` = fetch one row
  - `.all(limit, offset)` = fetch multiple rows

- **SQL vs JavaScript:**
  - Before: Create object, push to array → `orders.push(order)`
  - After: Insert into database → `db.prepare('INSERT ...').run(data)`
  
- **Database Methods:**
  - CREATE: `db.prepare('INSERT ...').run(data)`
  - READ (one): `db.prepare('SELECT ...').get(id)`
  - READ (many): `db.prepare('SELECT ...').all(limit, offset)`
  - UPDATE: `db.prepare('UPDATE ...').run(newData)`
  - DELETE: `db.prepare('DELETE ...').run(id)`

- **Key Difference from In-Memory Storage:**
  - Data now persists even if server restarts
  - Every request still calls `prepare()` (fast because it just prepares)
  - Database handles concurrent requests safely
  - Can query efficiently with WHERE, ORDER BY, LIMIT, etc.

### Database Schema
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
```

### All Endpoints Verified Working ✅
- `GET /api/health` → Returns health status
- `POST /api/orders` → Creates order with database persistence
- `GET /api/orders?page=1&limit=10` → Paginated list from database
- `PATCH /api/orders/1/status` → Updates order status in database

### Next Session
- Add error handling and validation layer
- Write SQL schema documentation
- Implement webhook + retry logic

────────────────────

## 2026-08-06 | Input Validation for API

**Status:** ✅ Complete

### What Was Completed
- Added comprehensive validation for `POST /api/orders`:
  - Check required fields presence
  - Validate string length (2-100 chars)
  - Validate quantity (1-1000 integer)
  - Prevent SQL injection (check dangerous chars)
  - Return 400 for invalid data

- Added comprehensive validation for `PATCH /api/orders/:id/status`:
  - Validate order ID is positive integer
  - Validate status is non-empty string
  - Validate status is in allowed list: `pending`, `in_progress`, `completed`, `cancelled`
  - Return 404 if order not found
  - Return 400 for invalid inputs

### Validation Rules

#### POST /api/orders
| Field | Rule |
|-------|------|
| `customer_name` | String, 2-100 characters |
| `item_name` | String, 2-100 characters |
| `quantity` | Integer, 1-1000 |
| `pickup_slot` | String, 3-50 characters |
| **Security** | No SQL injection chars (--;/*;*/) |

#### PATCH /api/orders/:id/status
| Field | Rule |
|-------|------|
| `id` | Positive integer |
| `status` | String in `['pending', 'in_progress', 'completed', 'cancelled']` |

### Test Results Verified ✅
- Empty fields → 400
- Invalid types → 400
- Out of range values → 400
- SQL injection attempt → 400
- Invalid status → 400 with helpful message
- Non-existent order → 404
- Valid requests → 201/200

### Technical Concepts Learned
- **Type checking:** `typeof value !== 'string'`
- **Range validation:** `value <= 0 || value > max`
- **String validation:** `.length`, `.trim()`, `.includes()`
- **Number validation:** `Number.isInteger()`, `Number.isNaN()`
- **SQL injection prevention:** Check for dangerous characters before DB query
- **User-friendly errors:** Include allowed values in error message

### Next Session
- Refactor validation into separate file (`validators.ts`)
- Add unified error response format
- Write SQL schema documentation

────────────────────

## 2026-08-06 | Refactored Validation & Unified Error Handling

**Status:** ✅ Complete

### What Was Completed
- Created `src/validators.ts` module with:
  - `validateCreateOrder()` function
  - `validateUpdateOrderStatus()` function
  - Error response builders (createValidationError, createNotFoundError, etc.)

- Implemented unified error response format:
  ```json
  {
    "code": "VALIDATION_ERROR|NOT_FOUND|AUTH_ERROR|ORDER_CREATED|ORDER_UPDATED",
    "message": "Human-readable message",
    "details": { "field": "error reason" }  // optional
  }
  ```

- Refactored `index.ts`:
  - Removed inline validation code (50+ lines reduced)
  - Now uses `validateCreateOrder()` and `validateUpdateOrderStatus()`
  - Much cleaner and more readable
  - Easy to add new validators in future

- Updated response formats:
  - Success: `{ code: 'ORDER_CREATED', message: '...', data: order }`
  - Error: `{ code: 'VALIDATION_ERROR', message: '...', details: {} }`
  - 404: `{ code: 'NOT_FOUND', message: '...' }`

### Key Benefits
- **Separation of Concerns:** Validation logic in separate file
- **Reusability:** Same validators can be used in multiple routes
- **Maintainability:** Change validation rules in one place
- **Consistency:** All errors follow same format
- **Scalability:** Easy to add new fields and validation rules

### File Structure
```
src/
  ├── index.ts (main API routes, cleaner now)
  ├── db.ts (database connection)
  ├── validators.ts (NEW - all validation logic)
  ├── middleware/
  │   └── auth.ts
sql/
  └── schema.sql
```

### All Tests Verified ✅
- Successful order creation → 201 with code: ORDER_CREATED
- Missing fields → 400 with details object
- Invalid quantity → 400 with helpful message
- Invalid status → 400 listing allowed values
- Order not found → 404 with code: NOT_FOUND
- All validation rules still working

### Technical Concepts Learned
- **Module exports:** `export function`, `export interface`
- **Separation of concerns:** Move validation to dedicated module
- **Consistent error formats:** Easier for frontend to handle
- **Return objects:** `{ valid: boolean; error?: ErrorResponse }`
- **Optional chaining:** `details?: Record<string, string>`

### Next Session
- Write SQL schema documentation
- Implement webhook + retry logic
- Add more routes (GET /orders/:id, DELETE /orders/:id)

────────────────────

## 2026-08-06 | English Comments & SQL Schema Documentation

**Status:** ✅ Complete

### What Was Completed
- Converted all code comments from Chinese to English
  - `index.ts`: Updated route comments
  - `db.ts`: Updated database initialization comments
  - `validators.ts`: Updated validation comments
  
- Created comprehensive SQL Schema Documentation (`sql/SCHEMA.md`)
  - Table definitions with sample SQL
  - Column-by-column documentation
  - Data validation rules reference
  - API-to-Database mapping for all endpoints
  - Query patterns for common operations
  - Index strategy and performance considerations
  - Backup/restore procedures
  - Future enhancement suggestions

### Documentation Contents

#### Schema Overview
- `orders` table with 8 columns
- Primary key: `id` (auto-increment)
- Indexes: `idx_orders_status` for performance
- Timestamps: `created_at`, `updated_at`

#### Column Reference
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | INTEGER | PK, AUTO | Unique identifier |
| customer_name | TEXT | NOT NULL | 2-100 chars, no SQL injection |
| item_name | TEXT | NOT NULL | 2-100 chars, no SQL injection |
| quantity | INTEGER | NOT NULL | 1-1000 range |
| pickup_slot | TEXT | NOT NULL | 3-50 chars |
| status | TEXT | NOT NULL | pending/in_progress/completed/cancelled |
| created_at | DATETIME | DEFAULT NOW | Auto-set on insert |
| updated_at | DATETIME | DEFAULT NOW | Auto-set on update |

#### Query Patterns Documented
- Paginated retrieval with LIMIT/OFFSET
- Filter by status
- Filter by date range
- Count by status (GROUP BY)
- Recently updated records
- Composite queries

#### Performance Strategy
- Index on `status` for fast filtering
- Future: Index on `created_at` for time queries
- Future: Composite index for sorted status queries
- Scalability path: SQLite → PostgreSQL at 1M+ records

### Code Quality Improvements
- All comments now in English (professional standard)
- Consistent documentation format
- Clear variable naming throughout
- Validation rules documented in code AND schema

### Files Updated
```
src/
  ├── index.ts (English comments)
  ├── db.ts (English comments)
  ├── validators.ts (English comments)
sql/
  ├── schema.sql (original)
  └── SCHEMA.md (NEW - comprehensive documentation)
```

### Next Session
- Implement webhook + retry logic
- Add GET /api/orders/:id endpoint
- Add DELETE /api/orders/:id endpoint

────────────────────

## 2026-08-05 | PATCH Status Update API

**Status:** ✅ Complete

### What Was Completed
- Added `id` and `status` fields to order schema
- Built `PATCH /api/orders/:id/status` endpoint
- Added status validation (allowed: `pending`, `in_progress`, `completed`, `cancelled`)
- Implemented 404 for non-existent orders
- Implemented 400 for invalid statuses
- Verified full workflow: POST → GET → PATCH in Thunder Client

### Technical Concepts Learned
- **Array `find()` method:**
  - `orders.find((order) => order.id === orderId)` loops through array and returns first match
  - The `order` parameter in callback is automatically provided by `find()` for each element
  - Returns the matched object or `undefined` if not found
  
- **HTTP Method Semantics:**
  - PATCH = update part of a resource (just status field)
  - PUT = replace entire resource (less common for partial updates)
  
- **URL Path Params vs Query Params:**
  - Path params (`/api/orders/:id`) = identify one specific resource
  - Query params (`?page=2&limit=10`) = control how to list/filter
  - JSON body = send data for create/update operations

- **ID Generation Strategy:**
  - Used `orders.length + 1` to auto-generate simple IDs
  - Works for in-memory storage but needs UUID/database ID for production

### Example Workflow Tested
```
1. POST /api/orders with JSON body
   → Returns order with id: 1, status: "pending"

2. PATCH /api/orders/1/status with JSON body { "status": "completed" }
   → Returns updated order with status: "completed"
```

### Next Session
- Add SQL database for data persistence
- Write SQL schema and migration docs
- Replace in-memory array with database queries