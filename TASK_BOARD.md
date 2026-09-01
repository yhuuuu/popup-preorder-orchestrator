# Task Board

## To Do

- [ ] Rotate the dev API token and remove the hardcoded `dev-token` fallbacks
- [ ] Move the API token server-side using a Vite dev proxy
- [ ] Build the user's own portfolio webpage, then add a project write-up and demo recording linking to this repo (no live deployment planned — SQLite isn't persistent on most free hosts)

## Doing

- [ ] (Move active task here)

## Done

- [x] Created project PM planning files
- [x] Drafted MVP scope and acceptance criteria
- [x] Initialized TypeScript + Express backend and project structure
- [x] Added bearer-token authentication and unified error handling
- [x] Built order creation, paginated order listing, and order status update endpoints
- [x] Added SQLite database persistence and test database isolation
- [x] Built webhook callback handling, retry logic, and webhook event logging
- [x] Added API tests for validation, authentication, retries, and CORS
- [x] Created SQL schema, validation, and migration documentation
- [x] Created API troubleshooting guide
- [x] Built React/Vite frontend order workflow
- [x] Added architecture and setup documentation
- [x] Confirmed GitHub Actions CI is green
- [x] Fixed multi-origin CORS support for frontend ports 5173 and 5175 (`d2ea67b`)
- [x] Added loading, error, and empty states to the Orders page
- [x] Added multi-item orders (`order_items` + `menu_items`, `GET /api/menu`)
- [x] Restricted pickup time to a fixed dropdown of real slots (`GET /api/pickup-slots`)
- [x] Migrated the frontend to a TanStack Start + Tailwind + shadcn dashboard ("Bakery Based"), rewired to the real API/data model
- [x] Restyled the Webhook Events page to match the approved design spec
- [x] Replaced the Lovable favicon with a custom bakery icon; removed the stale promo banner
- [x] Added search/status filters to `GET /api/orders`; expanded CORS allowlist to ports 8080/8081/8082
- [x] Fixed flaky CI (frontend `npm ci` → `npm install`) and merged PR #1 (`feat/new-frontend` → `main`)
- [x] Verified the full order → status-update → webhook flow end-to-end on `main`
