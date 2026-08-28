# Bakery Dashboard

Create a polished frontend UI for a pop-up food vendor pre-order management dashboard.

Tech stack:

- React

- TypeScript

- Vite

- Use responsive design for desktop, tablet, and mobile

- Use mock data initially, but structure the code so it can later connect to a REST API

Design style:

- Minimal, elegant, warm bakery aesthetic

- Background color: #f2efe5

- Lavender accent: #d6c7e9

- Dark green: #2f513a

- White cards

- No dark theme

- No Chinese text

- No emojis

- Avoid oversized cards and excessive spacing

- Use clean typography, subtle borders, and soft shadows

- The interface should feel professional and interview-ready

Pages and features:

1. Order Dashboard

- Header with the title “Pop-up Orders”

- Primary button: “New Order”

- Compact order table/list showing many orders at once

- Columns:

  - Order ID

  - Customer

  - Item

  - Quantity

  - Pickup time

  - Status

  - Actions

- Status badges:

  - Pending

  - Preparing

  - Ready

  - Cancelled

- Add search and status filtering

- Add pagination or a compact “Load more” option

- Include loading, empty, and error states

- Clicking an order opens its detail view

2. Create Order Page

- Form fields:

  - Customer name

  - Item name

  - Quantity

  - Pickup time

- Clear labels and validation messages

- Submit button: “Create Order”

- Cancel/back button

- Show success and error notifications

- After successful submission, return to the dashboard

3. Order Detail Page

- Display complete order information

- Show current status

- Allow status updates

- Include buttons for:

  - Mark as preparing

  - Mark as ready

  - Cancel order

  - Delete order

- Add a confirmation dialog before destructive actions

4. Webhook Events Page

- Display webhook callback history

- Columns:

  - Event ID

  - Order ID

  - Event type

  - Delivery status

  - Attempt count

  - Created time

- Show success, failed, and retrying states

- Include an expandable row for event details

Component and code requirements:

- Use reusable components for buttons, badges, cards, tables, forms, dialogs, and notifications

- Keep components accessible and keyboard-friendly

- Use semantic HTML

- Keep the layout compact and information-dense

- Avoid putting all styles in one huge component

- Use a clean folder structure

- Include realistic sample order data

- Make the UI visually consistent across all pages

- Include responsive behavior for small screens

You can add this at the end if Lovable needs to connect to your existing backend:

The backend API runs at http://localhost:3000/api.

Use Bearer token authentication:

Authorization: Bearer dev-token

Available endpoints include:

- GET /api/orders

- POST /api/orders

- GET /api/orders/:id

- PUT /api/orders/:id

- DELETE /api/orders/:id

- GET /api/webhooks/events

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b5929399-8c23-4a20-9b06-a97d6ffb0426).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
