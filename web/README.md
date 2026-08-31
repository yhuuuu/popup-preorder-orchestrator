# Pop-up Orders — web

Frontend for the pop-up pre-order dashboard. Talks to the Express API in `../app`.

The UI was generated with Lovable and then rewired to the real API; the data
layer in `src/lib/orders/` is hand-written and is the contract with the backend.

## Running it

The API must be running first, otherwise every page shows its error state:

```bash
cd ../app && npm install && npm run dev   # http://localhost:3000
cd ../web && npm install && npm run dev   # http://localhost:8080
```

`npm run dev` serves on **port 8080**. That port must appear in `FRONTEND_ORIGIN`
in `app/.env`, or the browser blocks every request with a CORS error.

## Configuration

`web/.env` (not committed):

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_TOKEN=dev-token
```

`VITE_`-prefixed variables are bundled into the browser JavaScript and are
readable by anyone. That is fine for a local dev token, but a real deployment
has to move the token server-side.

## Layout

| Path | Purpose |
| --- | --- |
| `src/routes/` | Pages, one file per route (TanStack Router) |
| `src/lib/orders/types.ts` | The API contract. Fields are snake_case because they come straight from the JSON |
| `src/lib/orders/api.ts` | The only place that performs HTTP calls |
| `src/lib/orders/queries.ts` | react-query options, so caching lives in one place |
| `src/components/orders/` | Order-specific components |
| `src/components/ui/` | shadcn/ui primitives, unmodified |

## Notes

- An order holds **many flavours**, each with its own quantity (`items[]`), so
  any view showing a single item name is out of date.
- Pickup times are a fixed list from `GET /api/pickup-slots`; do not hardcode them.
- Statuses are `pending`, `in_progress`, `completed`, `cancelled`.
- Timestamps arrive as SQLite's `"YYYY-MM-DD HH:MM:SS"` in UTC. Use the helpers
  in `src/lib/format.ts`, which normalise that before parsing.

## Checks

```bash
npx tsc --noEmit   # types
npm run lint       # eslint + prettier
npm run build      # production build
```
