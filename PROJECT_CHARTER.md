# Project Charter — PopUp Preorder Orchestrator

## Project Objective

Build an interview-ready implementation project that simulates a real pop-up food vendor workflow:

- pre-order intake
- production batch generation
- webhook callback delivery
- API troubleshooting and operational documentation

## Problem Statement

Pop-up vendors usually accept pre-orders first, then produce in batches before event day. They need a lightweight system that can track orders, generate prep quantities, and notify downstream systems.

## In Scope

- REST API endpoints for orders, batches, webhook testing
- Bearer token auth
- Pagination
- Webhook retry (max 3 attempts)
- Common 4xx/5xx error handling notes
- Basic SQL schema and validation scripts

## Out of Scope

- Full frontend app
- Live payment processing
- Advanced user management
- Enterprise cloud deployment

## Success Criteria

1. All MVP endpoints run successfully in Postman.
2. Auth/validation/error responses are consistent and documented.
3. Webhook callback supports retry and logs attempts.
4. README + diagram + error/fix note can be used in interviews.

## Stakeholders

- Project owner: Yuting Hu
- PM/mentor support: Copilot CLI

## Target Timeline

4 weeks total, with weekly deliverables.
