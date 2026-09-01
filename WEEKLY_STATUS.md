# Weekly Status

## Current Project Status

**Updated:** 2026-09-01
**Overall:** On Track
**Goal:** Complete an interview-ready pop-up food vendor pre-order application.

### Completed

- Built TypeScript + Express REST API with health check, order creation, order listing, and order-status updates.
- Added bearer-token authentication, input validation, unified error handling, and request logging.
- Added SQLite persistence, schema documentation, validation queries, and migration guidance.
- Built webhook callback processing with event logs and retry behavior.
- Added backend tests for authentication, validation, retries, CORS, and core order routes.
- Confirmed GitHub Actions CI is green.
- Added loading, error, and empty states to the Orders page, including a Retry action. Background poll failures now show a non-destructive banner instead of clearing the loaded list.
- Fixed the CORS outage blocking the frontend on `http://localhost:5175` (`d2ea67b`). Root cause was two stacked bugs: the backend never loaded `app/.env` (no `dotenv`, no `--env-file`), so `FRONTEND_ORIGIN` was ignored and fell back to a hardcoded `http://localhost:5173`; and `FRONTEND_ORIGIN` was compared as a single string, so a comma-separated value could never have matched. Verified from 5173 and 5175, with unknown origins still rejected.
- Added multi-item orders: one order can now hold several tiramisu flavours, each with its own quantity (`order_items` + `menu_items` tables, `GET /api/menu`).
- Restricted pickup time to a fixed dropdown of real slots (`GET /api/pickup-slots`).
- **Migrated the entire frontend** (`web/`) from the original hand-built React app to a Lovable-generated TanStack Start + Tailwind + shadcn dashboard, rewired to the real API and multi-item data model. Renamed the app to "Bakery Based." Rebuilt the order form, orders table, and Webhook Events page (per an approved design screenshot) to match the real backend contract. Replaced the default Lovable favicon with a custom bakery icon and removed a stale placeholder promo banner.
- Added `search`/`status` query filters to `GET /api/orders` (SQL-level, so pagination stays correct) and expanded the CORS allowlist to cover local dev ports 8080/8081/8082.
- Opened, fixed CI for (frontend `npm ci` was flaky against the lockfile across platforms; switched to `npm install` for the frontend job), and merged **PR #1** (`feat/new-frontend` → `main`, 19 commits) on GitHub.
- Verified the full order → status-update → webhook flow end-to-end against the merged `main` branch.

### In Progress

- None.

### Blockers

- None.

### Next Week Plan

1. Rotate the dev API token and remove the hardcoded `dev-token` fallbacks so a missing `.env` fails loudly instead of silently (still open, see Risk R8).
2. Build the user's personal portfolio webpage, then add a project write-up + short screen recording of the demo flow linking back to the GitHub repo. (No live deployment planned for now — SQLite isn't persistent on most free hosts; a local demo/recording is the chosen showcase approach.)
3. Optional: rehearse the 3-minute interview presentation script live.

---

## Weekly Update Template

Copy this section each week:

### Week X Status

**Overall:** On Track / At Risk / Delayed  
**Goal:**  

### Completed

- ### In Progress

- 

### Blockers

- ### Next Week Plan
1. 
2. 
3. 
