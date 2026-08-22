# PopUp Preorder Orchestrator

A production-ready TypeScript + Express backend API for managing pop-up food vendor pre-orders with webhook support, retry logic, and comprehensive error handling.

## Features

✅ **REST API** — Full CRUD operations on orders  
✅ **Bearer Token Auth** — Secure API endpoints  
✅ **SQLite Persistence** — Durable data storage  
✅ **Input Validation** — Type checking, range validation, SQL injection prevention  
✅ **Webhook Callbacks** — Inbound webhook support with automatic retry  
✅ **Error Handling** — Unified error response format with troubleshooting logs  
✅ **Comprehensive Docs** — SQL schema, API reference, developer log  

---

## Quick Start

### Prerequisites
- Node.js v25+
- npm or yarn

### Installation

```bash
# Clone or navigate to project
cd app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

Server runs on `http://localhost:3000`

### Verify Setup

```bash
# Health check (no auth required)
curl http://localhost:3000/api/health

# Sample API request (requires Bearer token)
curl -H "Authorization: Bearer dev-token" \
  http://localhost:3000/api/orders
```

---

## API Endpoints

All endpoints except `/api/health` require Bearer token authentication via `Authorization: Bearer <token>` header.

### Orders Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (paginated) |
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/:id` | Get specific order |
| PATCH | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Delete order |

### Webhook & Troubleshooting

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/order-status` | Receive order status updates (requires webhook secret) |
| GET | `/api/webhooks/events` | View webhook processing history |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health status (no auth) |

---

## Example Requests

### 1. List Orders (Paginated)

```bash
curl -H "Authorization: Bearer dev-token" \
  "http://localhost:3000/api/orders?page=1&limit=10"
```

**Response:**
```json
{
  "page": 1,
  "limit": 10,
  "total": 5,
  "orders": [...]
}
```

### 2. Create Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Alice Chen",
    "item_name": "Margherita Pizza",
    "quantity": 2,
    "pickup_slot": "18:00-19:00"
  }'
```

**Response (201):**
```json
{
  "code": "ORDER_CREATED",
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "customer_name": "Alice Chen",
    "item_name": "Margherita Pizza",
    "quantity": 2,
    "pickup_slot": "18:00-19:00",
    "status": "pending",
    "created_at": "2026-08-10 14:00:00",
    "updated_at": "2026-08-10 14:00:00"
  }
}
```

### 3. Get Single Order

```bash
curl -H "Authorization: Bearer dev-token" \
  http://localhost:3000/api/orders/1
```

### 4. Update Order Status

```bash
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Authorization: Bearer dev-token" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

**Allowed statuses:** `pending`, `in_progress`, `completed`, `cancelled`

### 5. Delete Order

```bash
curl -X DELETE http://localhost:3000/api/orders/1 \
  -H "Authorization: Bearer dev-token"
```

### 6. Receive Webhook Callback

```bash
curl -X POST http://localhost:3000/api/webhooks/order-status \
  -H "x-webhook-secret: dev-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "status": "completed",
    "source_system": "kitchen"
  }'
```

### 7. View Webhook Events

```bash
curl -H "Authorization: Bearer dev-token" \
  "http://localhost:3000/api/webhooks/events?limit=20"
```

---

## Environment Configuration

Create `.env` file in the `app/` directory:

```bash
# Bearer token for API authentication
API_TOKEN=dev-token

# Webhook secret for incoming callbacks
WEBHOOK_SECRET=dev-webhook-secret
```

See `.env.example` for defaults.

---

## Data Validation

### Order Creation
- `customer_name`: 2-100 characters, no SQL injection chars
- `item_name`: 2-100 characters, no SQL injection chars
- `quantity`: Integer 1-1000
- `pickup_slot`: 3-50 characters

### Order Status
- Must be one of: `pending`, `in_progress`, `completed`, `cancelled`

### Error Responses
All validation errors return `400 Bad Request`:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "quantity must be an integer",
  "details": {
    "quantity": "invalid"
  }
}
```

---

## Architecture

### Tech Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite 3
- **Build**: tsx (for TS compilation)
- **Dev**: nodemon (auto-reload)

### Project Structure

```
app/
├── src/
│   ├── index.ts           # Main API routes
│   ├── db.ts              # SQLite connection & initialization
│   ├── validators.ts      # Input validation logic
│   └── middleware/
│       └── auth.ts        # Bearer token authentication
├── sql/
│   ├── schema.sql         # Database table definitions
│   └── SCHEMA.md          # Comprehensive schema documentation
├── docs/
│   └── DEVLOG.md          # Development log with technical concepts
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── orders.db              # SQLite database file
```

---

## Key Technical Decisions

### Webhook + Retry Logic
- Inbound webhooks allow external systems to push status updates
- Automatic retry for temporary failures (e.g., database locked)
- Non-retryable errors (e.g., order not found) fail immediately
- All webhook events logged for troubleshooting

### Validation & Error Handling
- Input validation at application layer (before database)
- Parameterized SQL queries prevent SQL injection
- Unified error response format for easier client handling
- HTTP status codes follow REST conventions

### SQLite over In-Memory
- Persistent storage (survives server restarts)
- Supports querying, filtering, pagination
- Sufficient for small to medium workloads
- Can migrate to PostgreSQL when scaling beyond 100K+ records

---

## Scripts

```bash
# Development (with auto-reload)
npm run dev

# Build TypeScript
npm run build

# Run compiled JavaScript
npm start

# Test in Thunder Client or Postman
# Import the example requests from API Endpoints section above
```

---

## Troubleshooting

### 401 Unauthorized
- Check `Authorization: Bearer <token>` header
- Verify token matches `API_TOKEN` in `.env`

### 400 Validation Error
- Review request body format
- Check field types and ranges
- See Data Validation section above

### 404 Not Found
- Order ID doesn't exist in database
- Verify order was created successfully

### 503 Service Unavailable (Webhook)
- Webhook processing failed after 3 retries
- Check webhook event log: `GET /api/webhooks/events`
- Verify order exists before sending webhook

---

## Documentation

- **SQL Schema**: See `sql/SCHEMA.md` for detailed table definitions and query patterns
- **Dev Log**: See `docs/DEVLOG.md` for technical decisions and learning journey
- **API Reference**: See examples above or test with Postman/Thunder Client

---

## License

ISC

---

## Contact

For questions or feedback about this project, feel free to reach out.
