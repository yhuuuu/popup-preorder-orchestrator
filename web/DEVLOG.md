# Frontend Development Log

## Frontend Overview
- React + Vite + TypeScript
- Compact dashboard UI for pop-up food vendor orders
- Hash-based routing between order list and create order pages
- Bakery aesthetic with cream, lavender, and dark green colors

---

## Prior Sessions Context
**Sessions 1-5:** (2026-08-05 to 2026-08-10 morning)
- Initialized Vite + React + TypeScript frontend project
- Set up axios API service layer
- Created order list page that fetches from backend API
- Designed bakery aesthetic UI with multiple color iterations
- Fixed multiple critical issues (see "Historical Issues" section)

---

## Session: Dashboard Redesign & Form Routing
**Date:** 2026-08-10 17:01-17:15  
**Focus:** Compact dashboard UI and create order form navigation

### Problems Encountered & Fixes

#### 1. Backend Connection Issues
- **Issue:** Frontend showed "ERR_CONNECTION_REFUSED" 
- **Root Cause:** Express server not running
- **Fix:** Started backend with `npm start` in `/app` directory

#### 2. CORS Blocked Cross-Origin Requests
- **Issue:** Browser blocked fetch from frontend (5173) to backend (3000)
- **Error:** "Access-Control-Allow-Origin header missing"
- **Root Cause:** Backend had no CORS middleware
- **Fix:** Added CORS middleware in backend (see app/DEVLOG.md)
- **Also:** Hard refresh browser (Cmd+Shift+R) to clear cached error responses

#### 3. TypeScript Type Import Error
- **Issue:** "Order is a type and must be imported using type-only import"
- **Location:** web/src/pages/OrderList.tsx line 2
- **Root Cause:** `verbatimModuleSyntax` compiler option enabled in tsconfig.json
- **Fix:** Changed `import { Order }` to `import { type Order }`

#### 4. Hash-Based Routing Not Working
- **Issue:** Clicking "+ New Order" button changed URL hash but page didn't switch to CreateOrder form
- **Root Cause:** Multiple issues:
  1. Hash parsing bug: `#/create`.slice(1).split('/')[0] returned empty string instead of "create"
  2. Component not re-rendering on page state change
  3. Race condition between setPage() and hash change event

**Fixes Applied (in order):**
1. Changed button from `window.location.href = '/#/create'` to `window.location.hash = '#/create'`
2. Fixed hash parsing logic: `.slice(2)` correctly extracts "create" from `#/create`
3. Fixed routing to rely solely on `hashchange` event listener
4. Added callback props to CreateOrder component for clean navigation back to orders
5. **Final solution:**
   - Button only sets hash: `window.location.hash = '#/create'`
   - hashchange event listener updates state: `setPage(hash)`
   - CreateOrder receives onBack callback to navigate back

#### 5. Order Cards Too Large & Wide
- **Issue:** User feedback: "box太大" and "别人的dashboard都很窄很多data的"
- **Problem:** Original 2-column card layout wasted space; could only see 3-4 orders per screen
- **Fixes:**
  - Changed from 2-column grid (customer info + large visual panel) to 5-column flex row
  - Reduced card spacing from 24px gap to 8px
  - Reduced padding from 32px to 16px
  - Reduced main content max-width from 1000px to 650px
  - Reduced h2 font-size from 32px to 24px
  - Removed large emoji visual from right side
  - Result: **Can now see 10+ orders in one screen** (true dashboard UX)

#### 6. Order Card Layout Redesign
- **Before:** 
  ```
  [Order 1 - Customer Name]      [🥐]
  [Lavender Item Box]            [emoji]
  [Qty] [Pickup]                 [large]
  [Status]                       [visual]
  ```
  Height: ~240px, Width: ~1000px
  
- **After (Current):**
  ```
  [#1] [Customer / Item] [Qty] [Pickup] [Status]
  ```
  Height: ~40px, Width: responsive, fits 5+ columns

### Changes Made

#### Frontend Files Modified

**web/src/App.tsx** (280 → 320 lines)
- ✅ Fixed hash parsing: `.slice(2)` for `#/create` format
- ✅ Redesigned order card layout from 2-col grid to 5-col flex row
- ✅ Simplified order card data structure:
  - Column 1: ID badge (lavender background)
  - Column 2: Customer + item (stacked text)
  - Column 3: Quantity (centered)
  - Column 4: Pickup time (centered)
  - Column 5: Status badge (color-coded)
- ✅ Reduced padding, gap, font sizes throughout
- ✅ Reduced content max-width to 650px
- ✅ Fixed "New Order" button to use hash navigation only
- ✅ Added onBack callback prop for CreateOrder component
- ✅ Proper routing: only returns CreateOrder when page === 'create'

**web/src/pages/CreateOrder.tsx** (10.7KB)
- ✅ Added `onBack` prop in component signature via interface
- ✅ Changed success redirect from `window.location.href = '/#/orders'` to calling `onBack()`
- ✅ Changed "Back to Orders" button to call `onBack()`
- ✅ Form still has all validation and error handling

**web/src/pages/OrderList.tsx**
- ✅ Fixed TypeScript import: `import { type Order }`

**web/src/services/api.ts**
- ✅ No changes (already working correctly)

**web/.env**
- ✅ Verified correct values for API URL and token

### Current State
- ✅ Backend running on http://localhost:3000 with CORS enabled
- ✅ Frontend running on http://localhost:5173 with Vite dev server
- ✅ Order list displaying all 6 sample orders from database
- ✅ Compact dashboard layout - 10+ orders visible at once
- ✅ "+ New Order" button works - navigates to create form in one click
- ✅ Create form page visible with all input fields
- ✅ Back button on form page navigates back to order list
- ✅ Hash routing working correctly: `#/orders` and `#/create`
- ✅ Colors match user preferences exactly

### Testing Checklist
- [ ] CreateOrder form submission end-to-end
  - Fill form with test data
  - Submit and verify order appears in list
  - Verify error handling (empty fields, API errors)
  - Verify success message displays before redirect
- [ ] Navigation tests
  - Click "+ New Order" → form appears
  - Click back button → returns to order list
  - Refresh page → stays on current view
  - Browser back button works
- [ ] Responsive design
  - Mobile layout (< 640px width)
  - Tablet layout (640px - 1024px)
  - Desktop layout (> 1024px)

### Next Steps (Recommended)
1. **Test CreateOrder form** - Full submission flow with API
2. **Build order detail page** - Click order row to expand details
3. **Build webhook viewer** - Show webhook callback logs
4. **Add error toast notifications** - Better UX for errors
5. **Responsive design** - Optimize for mobile and tablet

### Historical Issues Resolved (Previous Sessions)

#### File Corruption: Bearer Token Truncation (Session 1-2)
- **Issue:** `Authorization: Bearer dev-token` was truncated to `Bearer ****` during file creation
- **Root Cause:** Unclear - possibly system-level redaction or view tool limitation
- **Impact:** API service initialization failed; took 30+ minutes to debug
- **Resolution:** 
  - Used Python subprocess to write files directly instead of `create` tool
  - Avoided backtick template strings with sensitive values
  - Split token construction across multiple lines
  - Rewrote api.ts multiple times using different approaches
- **Learning:** For critical files with tokens, use direct file writes; avoid complex string interpolation

#### Vite Port Conflicts (Session 2-3)
- **Issue:** "Port 5173 already in use", tried fallback to 5174, both occupied
- **Root Cause:** Node processes not fully terminating; Vite caches persisting
- **Resolution:** 
  - Kill Node processes completely before restart: `kill <PID>` (not pkill)
  - Clear `.vite` cache directories: `rm -rf web/.vite`
  - Clear node_modules cache: `npm cache clean --force`
- **Learning:** Dev servers must be stopped completely; caches are persistent and must be manually cleared

#### TypeScript Import/Export Errors (Session 3-4)
- **Issue:** Multiple cascading errors:
  - `verbatimModuleSyntax` forcing type-only imports
  - Export/import mismatches in api.ts
  - Circular dependencies causing resolution failures
- **Root Cause:** Strict TypeScript config + complex module structure
- **Resolution:**
  - Use `import { type X }` syntax for type-only imports
  - Simplify App.tsx to use native `fetch()` instead of importing orderAPI for orders list
  - Keep api.ts only for CreateOrder component (which needs orderAPI object)
  - Separate concerns: simple components use fetch, complex components use api service
- **Learning:** Strict TypeScript requires careful import management; simpler code beats "proper" patterns when debugging; duplication is sometimes acceptable for maintainability

#### Design Aesthetic Iterations (Session 1-4)
- **Iteration 1:** Card-based layout with multiple accent colors, too dark, too crowded
- **Iteration 2:** Added lavender accents but main colors still misaligned
- **Iteration 3:** Applied exact color values from user reference images
  - User preference: warm bakery aesthetic (like "Bakery Based" Instagram aesthetic)
  - Rejected: dark backgrounds, emoji decorations, Chinese text
  - Final: Cream `#f2efe5`, Lavender `#d6c7e9`, Dark Green `#2f513a`
- **Learning:** Get exact color codes and reference images from users early; validate design changes immediately in browser; minimize iterations by getting specific feedback upfront

#### API Token Management (Session 1)
- **Issue:** Frontend couldn't authenticate with backend
- **Root Cause:** `.env` token values didn't match between `app/.env` and `web/.env`
- **Resolution:** 
  - Backend: `API_TOKEN=dev-token` in `app/.env`
  - Frontend: `VITE_API_TOKEN=dev-token` in `web/.env`
  - Axios interceptor adds `Authorization: Bearer ${token}` to all requests
  - Verified both have same value
- **Learning:** Environment variables must be synchronized; use same token in development; consider a shared .env.example

#### Cascading API Integration Issues (Session 4, 30+ mins debugging)
- **Issues in sequence:**
  1. Order list showed "Order not found" errors repeatedly
  2. Backend API responding but frontend couldn't parse response
  3. Multiple axios import/export errors cascading
  4. CORS not enabled in backend
  5. Browser caching failed responses

- **Root Cause:** Combination of three issues:
  - Token mismatch between .env files
  - CORS headers missing from backend responses
  - Import bugs creating circular dependencies
  - Browser cached 403/CORS error responses

- **Resolution Process:**
  - Verified backend running: `curl http://localhost:3000/api/orders`
  - Checked token value: matched in both .env files
  - Added CORS middleware to backend
  - Rebuilt and restarted backend
  - Hard refreshed frontend browser cache (Cmd+Shift+R)
  - Simplified App.tsx to use fetch() instead of complex imports
  - Verified working with curl including auth header

- **Learning:** 
  - Check dependencies first (network, CORS, auth) before diving into application code
  - Browser caches failed responses - hard refresh is essential after fixing backend issues
  - When import errors compound, consider simplifying architecture rather than debugging
  - Use curl with headers to verify API independently from frontend

---

## Session: Order Detail Page and Status Updates
**Date:** 2026-08-21  
**Focus:** Connecting order rows to individual order details

### Completed

- Added clickable order rows to the dashboard.
- Added hash route support for individual orders:
  - `#/orders`
  - `#/orders/1`
  - `#/create`
- Created `web/src/pages/OrderDetail.tsx`.
- Added order detail loading through `orderAPI.getOrderById()`.
- Added status update controls:
  - Pending
  - Preparing
  - Ready
  - Cancelled
- Added a back button from the detail page to the order list.
- Added TypeScript types for valid order statuses.
- Added comments explaining routing, API loading, and status updates.

### Errors Resolved

#### API ID Type Mismatch
- **Issue:** The API expected the order ID as a string, but the component used a number.
- **Fix:** Changed `OrderDetailProps.orderId` from `number` to `string`.

#### Invalid Status Type
- **Issue:** `updateOrderStatus()` only accepts the four valid status values.
- **Fix:** Added the `OrderStatus` union type:
  ```ts
  type OrderStatus =
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
  ```

#### TypeScript Semicolon Error
- **Issue:** Consecutive style assignments were interpreted as calling a string.
- **Fix:** Added semicolons to the mouse hover style assignments in `App.tsx`.

### Current State

- ✅ Create Order flow works.
- ✅ Empty form validation works.
- ✅ Created orders persist after browser refresh.
- ✅ Dashboard rows open the correct order detail page.
- ✅ Order details load from the API.
- ✅ Order status updates are connected to the backend.
- ✅ Frontend production build passes.

### Next Testing

- [ ] Test each status transition and refresh the page.
- [ ] Add delete order functionality with confirmation.
- [ ] Add loading and error styling to the detail page.
- [ ] Add webhook events viewer.

#### Order Status Update CORS Error
- **Issue:** The order detail page loaded correctly, but clicking Pending, Preparing, Ready, or Cancel showed `Failed to update order status`.
- **Cause:** The frontend sends status changes with a `PATCH` request, and the backend initially rejected the browser preflight request because `PATCH` was missing from its CORS method list.
- **Fix:** Added `PATCH` to the backend `Access-Control-Allow-Methods` header.
- **Frontend request:** `web/src/services/api.ts` calls `PATCH /orders/:id/status`.
- **Result:** Status updates can now reach the backend and persist to SQLite.

#### Webhook Event Field Mismatch
- **Issue:** The Webhook Events page showed `Status code: N/A`, `Error: None`, and no retry count even when the backend returned real event data.
- **Root Cause:** The frontend expected `success`, `status_code`, `attempt`, and `error_message`, but the API returns `status`, `attempt_count`, and `last_error`.
- **Fix:** Updated `WebhookEvent` and the event detail UI to use the backend field names.
- **Result:** Processed and failed webhook events now display their actual status, attempt count, error, and payload.

#### Webhook Detail Copy and Auto-Refresh
- **Issue:** Selecting or copying text inside an expanded webhook detail row triggered the parent row click and collapsed the detail.
- **Fix:** Stopped click-event propagation inside the expanded detail area.

- **Issue:** The Order Board and Webhook Events page required a manual browser refresh after external webhook changes.
- **Fix:** Added five-second polling to both pages and cleanup when the page is unmounted.
- **Result:** New order statuses and webhook events appear automatically.

## Technical Specifications

### Color Palette (User Finalized)
- **Background:** `#f2efe5` (warm cream)
- **Lavender accent:** `#d6c7e9` (for highlights and badges)
- **Dark green:** `#2f513a` (for text and borders)
- **Status colors:** Light tints of lavender/green for pending/completed states
- **No decorations:** No emoji, no Chinese characters, minimal and clean aesthetic

### Responsive Breakpoints (Planned)
- Mobile: < 640px - Single column, larger touch targets
- Tablet: 640px - 1024px - Two columns
- Desktop: > 1024px - Five columns (current)

### Font Stack
- Family: 'Segoe UI', Roboto, sans-serif
- Sizes: 24px (titles), 14px (labels), 12px (details), 10px (status)
- Weights: 600 (labels), 700 (headings), 400 (body)

### Timestamps
- Session start: 2026-08-10 17:01:16 (order list displayed)
- CORS issue: 2026-08-10 17:02:00
- Routing issues: 2026-08-10 17:09:00
- Session end: 2026-08-10 17:15:43 (committed to git)
- Total session: ~14 minutes
