# Backend API

This directory contains the TypeScript and Express backend for the Pop-up
Preorder Orchestrator.

## Responsibilities

- REST API for order management
- Bearer-token authentication
- SQLite persistence
- Request validation and consistent errors
- Order-status webhook processing
- Retry handling for transient database failures
- Webhook event history

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs at `http://localhost:3000`.

## Commands

```bash
npm run dev
npm test
npm run build
npm start
```

`npm test` uses `orders.test.db` so automated tests do not modify the local
development database.

## Main files

```text
src/index.ts        Express app and API routes
src/db.ts           SQLite connection and schema initialization
src/validators.ts   Request validation
src/middleware/     Authentication, logging, and error handling
docs/               Schema, validation, migration, and webhook documentation
```

See the [root README](../README.md) for the complete API reference.
