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
Payment reminder attempts return HTTP 503 when no configured channel provider is available.

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
| `/orders` | paged search, get, create draft, confirm draft, delete draft | server calculates tax/total; only draft orders can be deleted |
| `/production-entries` | paged list by product, create | rejects cannot exceed actual; accepted quantity is posted to stock atomically |
| `/inventory` | paged balances, create adjustment | stock decreases cannot exceed available; all adjustments create ledger rows |
| `/deliveries` | paged search, create, update delivery status | create requires an active order and valid remaining line quantity; status changes require an administrator and a valid transition |
| `/vehicles` | list active vehicles | no vehicle CRUD endpoint yet |
| `/payments` | paged search, collect, customer payment history | `GET /payments/customer/{customerId}` returns only that customer's records, newest first; invoice payments require matching customer and idempotency key; only successful payments reduce invoice balance; overpayments conflict |
| `/settings` | get/update profile contact and plant settings | profile role remains fixed until authentication/RBAC is implemented |
| `/invoices` | paged search, open invoices by customer, eligible orders, generate from confirmed order | one invoice per order; status is derived from successful payments; invoice amount copies the server-calculated order total |
| `/customers/{id}/payment-reminders` | send WhatsApp/SMS reminder | requires a configured provider; otherwise returns 503 and does not report success |
| `/reports/operations` | aggregated order, payment, delivery, production, and current inventory summary | optional ISO `from`/`to` dates; dated operational totals are range-filtered, inventory is a current snapshot |

## Invoice and payment lifecycle

- Confirm a draft with `POST /orders/{id}/confirm`. Draft and cancelled orders cannot be invoiced.
- `GET /invoices/eligible-orders` lists confirmed, non-cancelled orders without invoices. `POST /invoices` accepts `{ "orderId": 123 }`; duplicate issuance conflicts.
- `GET /invoices?customerId=123&openOnly=true` lists unpaid or partially paid invoices. Each invoice response includes `paidAmount`, `outstandingAmount`, `paymentStatus` (`UNPAID`, `PARTIALLY_PAID`, or `PAID`), `customerId`, and `orderId`.
- Invoice `POST /payments` requests provide `customerId`, `invoiceId`, `amount`, `paymentType`, `paymentDate`, and a stable `idempotencyKey`; `referenceNumber` and `remarks` are optional. `orderId` remains optional for backward compatibility but must match the invoice if supplied. `paymentStatus` is assigned by the server as `SUCCESSFUL` when an administrator records a receipt.
- Payment transaction statuses are `SUCCESSFUL`, `PENDING`, `FAILED`, and `REVERSED`; only `SUCCESSFUL` entries count toward invoice settlement. Existing payment rows are migrated as `SUCCESSFUL` to preserve the prior behavior in which every recorded row was counted.
- Payment responses include `customerId` and the persisted `createdAt` timestamp in addition to the business `paymentDate`; customer statements render `createdAt` in Asia/Kolkata time.
- Invoice-based payment creation locks the invoice and customer within a database transaction. A repeated idempotency key or payment-method/reference pair cannot create another row. Customer outstanding is the preserved legacy carry-forward amount plus outstanding balances across invoices.
- Reminder requests accept `{ "invoiceId": 123, "channel": "WHATSAPP" }` or `SMS`. The message includes customer name, invoice number, total, paid, outstanding, and instructions to contact the accounts team. No provider is configured in this repository; requests fail explicitly with HTTP 503 until one is supplied.

## Delivery status lifecycle

- Update a delivery with `PATCH /deliveries/{id}/status` and body `{ "status": "LOADING" }`. The endpoint requires an authenticated administrator and returns the updated delivery in the standard `ApiResponse` envelope.
- Allowed transitions are `PENDING → LOADING`, `LOADING → IN_TRANSIT` or `RETURNED`, and `IN_TRANSIT → DELIVERED` or `RETURNED`. `DELIVERED` and `RETURNED` are final; further changes conflict unless a separately authorized correction workflow is introduced.
- Invalid transitions return HTTP 409 with a clear message; a missing delivery returns 404. Entering `IN_TRANSIT` sets `dispatch_date`, and entering `DELIVERED` sets `delivered_at`. Existing delivery addresses and records are not rewritten.
- Existing active vehicles are listed by `GET /vehicles` and assigned during delivery creation; status updates do not alter vehicle or driver assignments.

## Business assumptions

- An order must be explicitly confirmed before invoice generation. This makes the existing `DRAFT` state meaningful and preserves draft deletion behavior.
- Invoice amount equals the order's server-calculated total. Since there is no configured company tax jurisdiction, invoice tax is currently split equally between CGST and SGST (with rounding remainder assigned to SGST); this is an implementation default, not a tax-compliance determination.
- Recording a payment in the administrator workflow means funds have been received, so the server records it as `SUCCESSFUL`. Other transaction states are reserved for later provider reconciliation and do not reduce balances.
- The migration retains any pre-existing customer balance not represented by open invoice balances as `legacy_outstanding_amount`; this prevents the invoice lifecycle from silently discarding historical receivables.

## Not Implemented

Login/refresh/logout and password recovery; role-management UI; general order status transitions beyond draft confirmation; delivery status correction workflow and challan PDF; invoice PDF/email; report exports; configured WhatsApp/SMS provider integration; and audit event capture.

The existing invoice API now supports issuance and settlement display but does not generate PDFs or email invoices. The operations report currently includes all matching order/payment records regardless of order status, counts deliveries by creation timestamp (UTC date boundaries), and reports inventory as current balances independent of the selected date range. Confirm those reporting interpretations with business owners before using the figures for accounting or compliance.

Pagination follows Spring Data page numbering (`page` starts at 0). Monetary values currently serialize as JSON numbers backed by Java `BigDecimal`; clients should avoid binary floating-point arithmetic for financial totals. OpenAPI is available at `/v3/api-docs` and Swagger UI at `/swagger-ui.html`.
