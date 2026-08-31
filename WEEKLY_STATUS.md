# Weekly Status

## Current Project Status

**Updated:** 2026-08-28
**Overall:** On Track
**Goal:** Complete an interview-ready pop-up food vendor pre-order application.

### Completed

- Built TypeScript + Express REST API with health check, order creation, order listing, and order-status updates.
- Added bearer-token authentication, input validation, unified error handling, and request logging.
- Added SQLite persistence, schema documentation, validation queries, and migration guidance.
- Built webhook callback processing with event logs and retry behavior.
- Added backend tests for authentication, validation, retries, CORS, and core order routes.
- Built React/Vite frontend order workflow and removed unused legacy UI files.
- Added backend, frontend, and root README documentation, plus interview troubleshooting scenarios.
- Confirmed GitHub Actions CI is green.
- Added loading, error, and empty states to the Orders page, including a Retry action. Background poll failures now show a non-destructive banner instead of clearing the loaded list.
- Fixed the CORS outage blocking the frontend on `http://localhost:5175` (`d2ea67b`). Root cause was two stacked bugs: the backend never loaded `app/.env` (no `dotenv`, no `--env-file`), so `FRONTEND_ORIGIN` was ignored and fell back to a hardcoded `http://localhost:5173`; and `FRONTEND_ORIGIN` was compared as a single string, so a comma-separated value could never have matched. Verified from 5173 and 5175, with unknown origins still rejected.

### In Progress

- None.

### Blockers

- None.

### Next Week Plan

1. Rotate the dev API token and remove the hardcoded `dev-token` fallbacks so a missing `.env` fails loudly instead of silently.
2. Add order filtering and sorting, then complete the final interview demo flow.
3. Export the Postman collection and capture demo screenshots for the README.

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
