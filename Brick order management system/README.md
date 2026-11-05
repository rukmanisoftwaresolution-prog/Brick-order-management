# Brick Order & Customer Management System

A full-stack foundation for brick manufacturing, sales, production, dispatch, inventory, and finance operations.

## Current implementation status

This repository is an in-progress ERP, not yet production-ready. Implemented workflows currently include:

- Spring Boot 3.5 / Java 21 backend, PostgreSQL, Flyway, JPA, MapStruct, OpenAPI, validation, and shared API response/error handling.
- Customer CRUD/search, product CRUD API and create/list UI, and draft order create/list/delete with server-side GST totals.
- Production entry create/list with accepted output posted to inventory; inventory list and audited receipt/damage/stocktake adjustments.
- Delivery create/list with vehicle lookup, challan numbers, and remaining-order-quantity validation; payment create/list with customer/order checks and overpayment protection.
- Flyway V1 schema for users/roles/permissions and customer, product, order, production, inventory, delivery, payment, invoice, notification, and audit data.
- Angular customer, product, order, production, inventory, delivery, payment, and profile/plant settings screens connected to the dev API; responsive dashboard shell and Chart.js sample graph.
- Docker Compose for local PostgreSQL/backend, CI build workflow, API contract, ER diagram, implementation plan, and deployment guidance.

Invoices/GST PDF, operational and financial reports, login/JWT/RBAC, password recovery, order status transitions, delivery status transitions, notification sending, and audit event capture are not implemented. Settings currently stores profile/contact and plant fields; it does not manage accounts or roles. Invoice tax jurisdiction and company GST configuration need business confirmation. These pages remain informational placeholders; they do not have create buttons. Do not deploy this version with real customer, payment, or tax data.

Angular 18.2.20 is not published; the frontend is pinned to the final published 18.2 patch, 18.2.14. JPA repositories must use JPQL or derived query methods; do not add native SQL JPA queries. Flyway SQL is used for database schema migration only.

The production dependency audit currently reports 13 Angular-related advisories (including high severity) for the Angular 18 line, with no fixes available in that line. This requested major version must not be used for a public production deployment; upgrade the Angular framework and aligned Material/NgRx packages to a patched supported release before release.

## Requirements

- Java 21 and Maven 3.9+
- Node.js 20 and npm
- Docker Engine with Docker Compose (optional if using a local PostgreSQL service)

## Run locally

```sh
cp .env.example .env
# Edit .env and replace both sample passwords.
docker compose up --build
```

The API listens at `http://localhost:8080`. Swagger UI is `http://localhost:8080/swagger-ui.html`. Direct local Spring runs use the `dev` profile, which permits unauthenticated API calls only on loopback and allows the Angular dev origin. Compose overrides the bind address for its container network. Production does not use this dev security configuration.

The local `brickerp` database has Flyway V1 applied and contains repeatable `TEST-` customers, products, stock, orders, production, delivery, and payment records. The seed SQL is at [`backend/src/main/resources/db/dev-seed.sql`](backend/src/main/resources/db/dev-seed.sql); the secure runner at [`scripts/RunDevSeed.java`](scripts/RunDevSeed.java) prompts for the PostgreSQL password without echoing it.

To apply or rerun the seed from the repository root:

```sh
mvn -q -f backend/pom.xml process-resources dependency:build-classpath -Dmdep.outputFile=/tmp/brick-backend-cp
javac -proc:none -cp "$(cat /tmp/brick-backend-cp)" -d /tmp/brickseed-classes scripts/RunDevSeed.java
java -cp "/tmp/brickseed-classes:backend/target/classes:$(cat /tmp/brick-backend-cp)" RunDevSeed backend/src/main/resources/db/dev-seed.sql
```

Run backend tests:

```sh
mvn -f backend/pom.xml test
```

Run the Angular app:

```sh
cd frontend
npm ci
npm start
```

The frontend dev server is `http://localhost:4200`; its `/api` requests are proxied to the local backend.

## Customer API

All APIs return `ResponseEntity<ApiResponse<T>>` envelopes.

- `GET /api/v1/customers?q=brick&active=true&page=0&size=20`
- `GET /api/v1/customers/{id}`
- `POST /api/v1/customers`
- `PUT /api/v1/customers/{id}`
- `DELETE /api/v1/customers/{id}`

Use a JSON customer payload with required `customerCode`, `customerName`, `customerType`, and `creditLimit` fields. `customerType` is `INDIVIDUAL` or `BUSINESS`; the server owns the outstanding balance.

## Repository map

```text
backend/       Spring Boot layered API and Flyway migrations
frontend/      Angular standalone app, dashboard, and module routes
docs/          API contracts, ERD, implementation plan, deployment guide
deploy/        Nginx reverse proxy and backup script template
.github/       CI workflow
```

## Design and operational documents

- [API contracts](docs/API_CONTRACTS.md)
- [Entity relationship diagram](docs/ERD.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Deployment guide](docs/DEPLOYMENT.md)

## Production gates

Before a real deployment: replace Basic auth with JWT and full RBAC; build and authorize each module; validate Indian GST rules with a qualified tax professional; add integration and browser tests with meaningful coverage; scan dependencies and containers; configure secret storage, encrypted off-host backups, restore drills, monitoring, rate limits, and security review. The requested 80% coverage is not reached by this starter.
