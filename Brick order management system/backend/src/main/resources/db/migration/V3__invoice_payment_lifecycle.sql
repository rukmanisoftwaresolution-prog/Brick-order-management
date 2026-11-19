ALTER TABLE payments
    ADD COLUMN invoice_id BIGINT REFERENCES invoices(id),
    ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'SUCCESSFUL'
        CHECK (payment_status IN ('SUCCESSFUL', 'PENDING', 'FAILED', 'REVERSED')),
    ADD COLUMN idempotency_key VARCHAR(80),
    ADD COLUMN deduplication_key VARCHAR(120);

UPDATE payments p
SET invoice_id = i.id
FROM invoices i
WHERE p.order_id = i.order_id
  AND p.customer_id = i.customer_id;

WITH unique_references AS (
    SELECT payment_type, upper(btrim(reference_number)) AS normalized_reference
    FROM payments
    WHERE reference_number IS NOT NULL AND btrim(reference_number) <> ''
    GROUP BY payment_type, upper(btrim(reference_number))
    HAVING count(*) = 1
)
UPDATE payments p
SET deduplication_key = p.payment_type || ':' || upper(btrim(p.reference_number))
FROM unique_references r
WHERE p.payment_type = r.payment_type
  AND upper(btrim(p.reference_number)) = r.normalized_reference;

ALTER TABLE customers
    ADD COLUMN legacy_outstanding_amount NUMERIC(14,2) NOT NULL DEFAULT 0
        CHECK (legacy_outstanding_amount >= 0);

UPDATE customers c
SET legacy_outstanding_amount = GREATEST(
    c.outstanding_amount - COALESCE((
        SELECT SUM(GREATEST(i.invoice_amount - COALESCE((
            SELECT SUM(p.amount)
            FROM payments p
            WHERE p.invoice_id = i.id
              AND p.payment_status = 'SUCCESSFUL'
        ), 0), 0))
        FROM invoices i
        WHERE i.customer_id = c.id
    ), 0),
    0
);

UPDATE customers c
SET outstanding_amount = c.legacy_outstanding_amount + COALESCE((
    SELECT SUM(GREATEST(i.invoice_amount - COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        WHERE p.invoice_id = i.id
          AND p.payment_status = 'SUCCESSFUL'
    ), 0), 0))
    FROM invoices i
    WHERE i.customer_id = c.id
), 0);

CREATE UNIQUE INDEX uk_payments_idempotency_key
    ON payments (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX uk_payments_deduplication_key
    ON payments (deduplication_key)
    WHERE deduplication_key IS NOT NULL;

CREATE INDEX idx_payments_invoice_status
    ON payments (invoice_id, payment_status);
