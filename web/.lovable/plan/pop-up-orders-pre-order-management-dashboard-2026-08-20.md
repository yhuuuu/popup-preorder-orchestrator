# Pop-up Orders — Pre-order Management Dashboard

A compact, warm-bakery-styled dashboard for managing pop-up food vendor pre-orders. Four pages, reusable UI components, mock data behind a swappable API layer.

## Design system

Defined once in `src/styles.css` as semantic tokens (no hardcoded colors in components), light theme only:

- Background `#f2efe5`, white cards, dark green `#2f513a` as primary, lavender `#d6c7e9` as accent
- Status colors: pending (warm amber), preparing (lavender), ready (dark green), cancelled (muted clay)
- Typography: a serif display face for headings paired with a clean sans for UI text; compact scale, tight vertical rhythm
- Subtle 1px borders, soft low-opacity shadows, small radii — no oversized cards, no wide padding

## Pages

**1. Order Dashboard (`/`)**
Header "Pop-up Orders" + "New Order" button. Search input (customer/item/ID), status filter chips (All, Pending, Preparing, Ready, Cancelled), and a dense table: Order ID, Customer, Item, Qty, Pickup time, Status badge, Actions. "Load more" pagination. Loading skeleton, empty state, and error state with retry. Rows are keyboard-focusable and open the detail page. On mobile the table collapses into compact stacked cards.

**2. Create Order (`/orders/new`)**
Form: customer name, item name, quantity, pickup time. Inline field-level validation messages, labels tied to inputs, "Create Order" + "Cancel". Toast on success/error; success navigates back to the dashboard with the new order present.

**3. Order Detail (`/orders/$orderId`)**
Full order info panel with current status, plus status actions: Mark as preparing, Mark as ready, Cancel order, Delete order. Confirm dialog for cancel and delete. Actions disabled when not applicable (e.g. already ready). Not-found state for unknown IDs.

**4. Webhook Events (`/webhooks`)**
Table of callback history: Event ID, Order ID, Event type, Delivery status (success / failed / retrying), Attempt count, Created time. Each row expands (keyboard accessible) to show the event payload and delivery attempt log.

Shared header nav links Orders and Webhook Events; each route gets its own page metadata.

## Technical notes

- Routes as separate files under `src/routes/` (TanStack Router, already in the template); shared chrome in `__root.tsx`.
- Data layer: `src/lib/orders/` with `types.ts`, `mock-data.ts` (~28 realistic orders + ~20 webhook events), and an `ordersApi` module exposing `listOrders`, `getOrder`, `createOrder`, `updateOrder`, `deleteOrder`, `listWebhookEvents`. Mock implementation with simulated latency behind the same interface, so swapping in `fetch` against `/api/orders` with a Bearer token later is a one-file change.
- TanStack Query for reads/mutations, so loading/error/empty states and cache invalidation come from one place.
- Reusable components in `src/components/ui/` (button, badge, card, table, input, dialog, toaster) and feature components in `src/components/orders/` — no single giant component.
- Semantic HTML (`table`, `form`, `main`, `nav`), visible focus rings, dialogs with focus trap and Escape.

Not included yet: live backend wiring. Say the word and I'll point the API layer at `http://localhost:3000/api` with `Authorization: Bearer dev-token`.
