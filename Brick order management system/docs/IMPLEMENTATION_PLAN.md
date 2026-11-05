# Step-by-Step Implementation Plan

## Foundation (current)

- Create Maven and Angular workspaces, PostgreSQL Docker Compose, and Flyway V1 schema.
- Implement the customer CRUD API with validation, pagination, a JPQL search query, MapStruct, and a shared response envelope.
- Add a responsive dashboard shell and route placeholders for all business areas.

## Security and shared platform

- Implement account lifecycle, password reset tokens, access/refresh JWT rotation, revocation, and RBAC from database permissions.
- Add audit event capture, request correlation IDs, consistent problem handling, rate limits, CORS policy, and secret management.
- Add Testcontainers integration tests and OpenAPI security definitions.

## Catalog, orders, and inventory

- Build product CRUD and stock ledger.
- Implement order draft/edit/confirm/approve/cancel with a validated state machine and transactional reservation.
- Add optimistic locking and idempotency keys for stock/payment mutations.

## Production and dispatch

- Add production planning, daily entries, rejects, and production-to-stock posting.
- Add vehicle management, delivery challans, partial delivery, and order fulfillment reconciliation.

## Finance

- Add payment collection/reversal and customer ledger.
- Confirm GST invoice rules with a qualified tax stakeholder; implement invoice snapshots, numbering, PDF and email delivery.
- Implement outstanding, sales, GST, inventory valuation, and operations reports with export limits.

## Frontend workflows

- Build authenticated login and route guards, role-aware navigation, reactive forms, filters, sorting, pagination, and API error states.
- Implement dedicated CRUD/detail views, order timeline, customer ledger, delivery tracking, and responsive charts.
- Wire NgRx only for shared workflows that benefit from normalized state; prefer local signals for transient view state.

## Release readiness

- Add unit, API integration, migration, authorization, and browser tests; enforce coverage gates by package.
- Conduct threat modeling, dependency scanning, load tests, accessibility checks, restore drills, and financial reconciliation tests.
- Deploy to staging, run UAT, verify rollback and recovery, then release with monitoring and incident ownership.

The 80% target should be enforced once modules and meaningful branch coverage exist; coverage percentage alone is not a production-readiness criterion.
