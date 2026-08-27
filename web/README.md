# Frontend Dashboard

This directory contains the React and Vite dashboard for the Pop-up Preorder
Orchestrator.

## Responsibilities

- Display the order dashboard
- Create new orders
- View order details
- Update order status
- Delete orders
- Display webhook processing history
- Refresh order and webhook data automatically

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The dashboard runs at `http://localhost:5173`. The backend must be running at
the API URL configured in `VITE_API_BASE_URL`.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run preview
```

## Main files

```text
src/App.tsx                 Hash routing and dashboard layout
src/pages/CreateOrder.tsx   Order creation form
src/pages/OrderDetail.tsx   Order details and actions
src/pages/WebhookEvent.tsx  Webhook event history
src/services/api.ts         Axios client and shared API types
src/App.css                 Responsive dashboard styling
```

See the [root README](../README.md) for the complete project overview.
