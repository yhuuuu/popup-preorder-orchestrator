# Pop-up Preorder Orchestrator

An interview-ready full-stack TypeScript application for managing pop-up food
vendor pre-orders. It includes a REST API, Bearer-token authentication,
SQLite persistence, webhook callbacks, retry handling, and a React dashboard.

## Architecture

```text
React + TanStack Start dashboard (web:8080)
              |
              | Axios / JSON / Bearer token
              v
Express + TypeScript API (app:3000)
              |
              v
        SQLite database

External kitchen system
              |
              v
POST /api/webhooks/order-status
```

## Features

- Create, list, inspect, update, and delete pre-orders
- Order several tiramisu flavours in one order, each with its own quantity
- Search orders by customer or flavour and filter them by status
- Validate request fields and return consistent 4xx errors
- Protect order routes with Bearer-token authentication
- Receive order status callbacks from an external system
- Retry transient webhook failures up to three times
- Record webhook attempts, failures, and error messages
- Use a separate SQLite database for automated tests
- Run backend tests and frontend checks in GitHub Actions

## Prerequisites

- Node.js 18 or newer
- npm

## Run locally

Start the backend in one terminal:

```bash
cd app
npm install
cp .env.example .env
npm run dev
```

Start the dashboard in a second terminal:

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

The API runs at `http://localhost:3000` and the dashboard runs at
`http://localhost:8080`.

The dashboard port must appear in `FRONTEND_ORIGIN`, or the browser blocks
every request with a CORS error.

## Environment variables

Backend variables are defined in `app/.env.example`:

```text
API_TOKEN=dev-token
WEBHOOK_SECRET=dev-webhook-secret
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:8080
```

Frontend variables are defined in `web/.env.example`:

```text
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TOKEN=dev-token
```

Do not commit `.env` files or SQLite runtime databases.

## API endpoints

All endpoints except `/api/health` require authentication. Order routes use
`Authorization: Bearer <API_TOKEN>`. The webhook uses the
`x-webhook-secret` header.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Check API availability |
| GET | `/api/orders` | List paginated orders, filterable by `search` and `status` |
| GET | `/api/menu` | List the tiramisu flavours available to order |
| GET | `/api/pickup-slots` | List the pickup times the pop-up offers |
| POST | `/api/orders` | Create an order |
| GET | `/api/orders/:id` | Retrieve one order |
| PATCH | `/api/orders/:id/status` | Update order status |
| DELETE | `/api/orders/:id` | Delete an order |
| POST | `/api/webhooks/order-status` | Process an external status callback |
| GET | `/api/webhooks/events` | Review webhook history |

Example:

```bash
curl http://localhost:3000/api/health

curl -H "Authorization: Bearer dev-token" \
  http://localhost:3000/api/orders
```

## Testing and builds

Run backend tests with an isolated test database:

```bash
cd app
npm test
npm run build
```

Run frontend checks:

```bash
cd web
npm run lint
npm run build
```

GitHub Actions runs these checks for pushes and pull requests.

## Documentation

- [`app/sql/schema.sql`](./app/sql/schema.sql) - Current SQLite schema
- [`app/docs/validation.sql`](./app/docs/validation.sql) - Data-quality checks
- [`app/docs/MIGRATIONS.md`](./app/docs/MIGRATIONS.md) - Migration and rollback workflow
- [`app/docs/WEBHOOK_TESTING.md`](./app/docs/WEBHOOK_TESTING.md) - Manual webhook tests
- [`app/DEVLOG.md`](./app/DEVLOG.md) - Backend decisions and troubleshooting
- [`web/README.md`](./web/README.md) - Frontend setup and data-model notes

## Interview demonstration

1. Create an order in the dashboard.
2. Update its status through the API or a webhook callback.
3. Open Webhook Events to show processing history and errors.
4. Trigger an invalid order or secret to demonstrate 4xx handling.
5. Run `npm test` to show automated API coverage and CI readiness.
