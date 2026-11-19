# API Contracts

Base path: `/api/v1`. JSON requests and responses use `ApiResponse<T>`.

## Envelope

```json
{
  "success": true,
  "message": "Customer loaded.",
  "data": {},
  "timestamp": "2026-11-05T10:00:00Z"
}
```

Errors use the same envelope and a null `data`; validation failures return HTTP 400, missing resources 404, and conflicts 409.

## Implemented: Customers

| Method | Path | Purpose |
|---|---|---|
| GET | `/customers?q=brick&active=true&page=0&size=20&sort=customerName,asc` | Search and paginate |
| GET | `/customers/{id}` | Fetch one customer |
| POST | `/customers` | Create customer |
| PUT | `/customers/{id}` | Update customer |
| DELETE | `/customers/{id}` | Delete customer |

Create/update fields: `customerCode`, `customerName`, `customerType` (`INDIVIDUAL` or `BUSINESS`), `gstNumber`, `panNumber`, `address`, `city`, `state`, `pincode`, `contactPerson`, `mobileNumber`, `email`, `creditLimit`, `active`. Outstanding balance is server-owned and cannot be set by this request.

## Implemented Resource Contracts

| Resource | Implemented operations | Constraints |
|---|---|---|
| `/customers` | paged search, get, create, update, delete | unique code/GST, server-owned outstanding balance |
| `/products` | paged search, get, create, update, deactivate | unique product code; stock changes through inventory flows |
| `/orders` | paged search, get, create draft, delete draft | server calculates tax/total; only draft orders can be deleted |
| `/production-entries` | paged list by product, create | rejects cannot exceed actual; accepted quantity is posted to stock atomically |
| `/inventory` | paged balances, create adjustment | stock decreases cannot exceed available; all adjustments create ledger rows |
| `/deliveries` | paged search, create | order must be active; line must belong to order; cannot exceed remaining quantity |
| `/vehicles` | list active vehicles | no vehicle CRUD endpoint yet |
| `/payments` | paged search, collect | customer must match linked order; payment cannot exceed order balance |
| `/settings` | get/update profile contact and plant settings | profile role remains fixed until authentication/RBAC is implemented |
| `/invoices` | paged search by invoice number, order number, or customer name | read-only listing of rows already present in the invoices table |
| `/reports/operations` | aggregated order, payment, delivery, production, and current inventory summary | optional ISO `from`/`to` dates; dated operational totals are range-filtered, inventory is a current snapshot |

## Not Implemented

Login/refresh/logout and password recovery; role changes; order confirmation/status transitions; delivery status transitions, returns and challan PDF; customer ledger; invoice issuance/PDF/email; report exports; notification sending; and audit event capture. Invoice and GST calculations need validated tax jurisdiction/company configuration before implementation.

The invoice endpoint does not issue invoices or generate PDFs; it only lists existing invoice records. The operations report currently includes all matching order/payment records regardless of order status, counts deliveries by creation timestamp (UTC date boundaries), and reports inventory as current balances independent of the selected date range. Confirm those reporting interpretations with business owners before using the figures for accounting or compliance.

Pagination follows Spring Data page numbering (`page` starts at 0). Monetary values currently serialize as JSON numbers backed by Java `BigDecimal`; clients should avoid binary floating-point arithmetic for financial totals. OpenAPI is available at `/v3/api-docs` and Swagger UI at `/swagger-ui.html`.
