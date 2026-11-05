BEGIN;

INSERT INTO customers (
    customer_code, customer_name, customer_type, gst_number, address, city, state,
    pincode, contact_person, mobile_number, email, credit_limit, outstanding_amount, active
) VALUES
    ('TEST-CUST-001', 'Shree Ganesh Builders (Test)', 'BUSINESS', '27TEST00001A1Z5', '12 Market Road', 'Pune', 'Maharashtra', '411001', 'Rohan Patil', '9000001001', 'ganesh.test@example.com', 500000, 0, TRUE),
    ('TEST-CUST-002', 'Metro Construction (Test)', 'BUSINESS', '27TEST00002A1Z4', '48 Station Road', 'Mumbai', 'Maharashtra', '400001', 'Neha Shah', '9000001002', 'metro.test@example.com', 750000, 0, TRUE),
    ('TEST-CUST-003', 'Vishal Traders (Test)', 'BUSINESS', '27TEST00003A1Z3', '7 Industrial Estate', 'Nashik', 'Maharashtra', '422001', 'Vishal Jain', '9000001003', 'vishal.test@example.com', 250000, 0, TRUE)
ON CONFLICT (customer_code) DO NOTHING;

INSERT INTO products (
    product_code, product_name, size, weight_kg, gst_percentage, current_rate,
    opening_stock, minimum_stock, active
) VALUES
    ('TEST-RED-001', 'Red Brick - Test', '230 x 110 x 70 mm', 3.200, 5.00, 11.50, 10000, 1000, TRUE),
    ('TEST-FLY-001', 'Fly Ash Brick - Test', '230 x 110 x 75 mm', 2.800, 5.00, 9.50, 8000, 800, TRUE),
    ('TEST-CON-001', 'Concrete Brick - Test', '200 x 100 x 100 mm', 4.500, 18.00, 16.00, 5000, 500, TRUE),
    ('TEST-HOL-001', 'Hollow Block - Test', '400 x 200 x 200 mm', 12.000, 18.00, 85.00, 2000, 200, TRUE),
    ('TEST-PAV-001', 'Paver Block - Test', '200 x 100 x 60 mm', 2.600, 18.00, 23.00, 6000, 600, TRUE),
    ('TEST-INT-001', 'Interlocking Block - Test', '300 x 150 x 100 mm', 8.000, 18.00, 52.00, 2500, 250, TRUE)
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO inventory (product_id, available_stock, reserved_stock, damaged_stock, delivered_stock)
SELECT p.id, seed.available_stock, 0, 0, 0
FROM (VALUES
    ('TEST-RED-001', 10000::bigint),
    ('TEST-FLY-001', 8000::bigint),
    ('TEST-CON-001', 5000::bigint),
    ('TEST-HOL-001', 2000::bigint),
    ('TEST-PAV-001', 6000::bigint),
    ('TEST-INT-001', 2500::bigint)
) AS seed(product_code, available_stock)
JOIN products p ON p.product_code = seed.product_code
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO orders (
    order_number, customer_id, order_date, required_delivery_date, delivery_address,
    transportation_mode, remarks, status, subtotal, discount_total, tax_total, total_amount
)
SELECT seed.order_number, c.id, CURRENT_DATE, CURRENT_DATE + seed.days_until_delivery,
    seed.delivery_address, 'CUSTOMER_PICKUP', 'Test data, safe to remove by TEST- order/customer codes.',
       seed.status, seed.subtotal, 0, seed.tax_total, seed.total_amount
FROM (VALUES
    ('TEST-ORD-001', 'TEST-CUST-001', 7, '12 Market Road, Pune, Maharashtra 411001', 'CONFIRMED', 38250.00::numeric, 1912.50::numeric, 40162.50::numeric),
    ('TEST-ORD-002', 'TEST-CUST-002', 10, '48 Station Road, Mumbai, Maharashtra 400001', 'CONFIRMED', 36800.00::numeric, 6624.00::numeric, 43424.00::numeric),
    ('TEST-ORD-003', 'TEST-CUST-003', 14, '7 Industrial Estate, Nashik, Maharashtra 422001', 'DRAFT', 34500.00::numeric, 1725.00::numeric, 36225.00::numeric)
) AS seed(order_number, customer_code, days_until_delivery, delivery_address, status, subtotal, tax_total, total_amount)
JOIN customers c ON c.customer_code = seed.customer_code
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, rate, discount, gst_percentage, amount)
SELECT o.id, p.id, seed.quantity, seed.rate, 0, seed.gst_percentage, seed.amount
FROM (VALUES
    ('TEST-ORD-001', 'TEST-RED-001', 2500::bigint, 11.50::numeric, 5.00::numeric, 30187.50::numeric),
    ('TEST-ORD-001', 'TEST-FLY-001', 1000::bigint, 9.50::numeric, 5.00::numeric, 9975.00::numeric),
    ('TEST-ORD-002', 'TEST-PAV-001', 1600::bigint, 23.00::numeric, 18.00::numeric, 43424.00::numeric),
    ('TEST-ORD-003', 'TEST-RED-001', 3000::bigint, 11.50::numeric, 5.00::numeric, 36225.00::numeric)
) AS seed(order_number, product_code, quantity, rate, gst_percentage, amount)
JOIN orders o ON o.order_number = seed.order_number
JOIN products p ON p.product_code = seed.product_code
WHERE NOT EXISTS (
    SELECT 1 FROM order_items existing
    WHERE existing.order_id = o.id AND existing.product_id = p.id
);

INSERT INTO production_entries (
    product_id, production_date, target_quantity, actual_quantity, rejected_quantity,
    raw_material_consumption, kiln_name, machine_name, remarks
)
SELECT p.id, CURRENT_DATE, 3000, 2500, 70, 18.500, 'Kiln A - Test', 'Press 1 - Test', 'Development seed record'
FROM products p
WHERE p.product_code = 'TEST-RED-001'
  AND NOT EXISTS (
      SELECT 1 FROM production_entries existing
      WHERE existing.product_id = p.id AND existing.production_date = CURRENT_DATE
        AND existing.kiln_name = 'Kiln A - Test'
  );

INSERT INTO vehicles (vehicle_number, driver_name, driver_mobile, active) VALUES
    ('TEST-MH12AB0001', 'Test Driver One', '9000002001', TRUE),
    ('TEST-MH12AB0002', 'Test Driver Two', '9000002002', TRUE)
ON CONFLICT (vehicle_number) DO NOTHING;

INSERT INTO deliveries (
    delivery_number, order_id, vehicle_id, status, delivery_address, challan_number, remarks
)
SELECT seed.delivery_number, o.id, v.id, 'PENDING', seed.delivery_address,
       seed.challan_number, 'Development seed record'
FROM (VALUES
    ('TEST-DEL-001', 'TEST-ORD-001', 'TEST-MH12AB0001', '12 Market Road, Pune, Maharashtra 411001', 'TEST-CH-001'),
    ('TEST-DEL-002', 'TEST-ORD-002', 'TEST-MH12AB0002', '48 Station Road, Mumbai, Maharashtra 400001', 'TEST-CH-002')
) AS seed(delivery_number, order_number, vehicle_number, delivery_address, challan_number)
JOIN orders o ON o.order_number = seed.order_number
JOIN vehicles v ON v.vehicle_number = seed.vehicle_number
ON CONFLICT (delivery_number) DO NOTHING;

INSERT INTO delivery_items (delivery_id, order_item_id, quantity)
SELECT d.id, oi.id, seed.quantity
FROM (VALUES
    ('TEST-DEL-001', 'TEST-ORD-001', 'TEST-RED-001', 2500::bigint),
    ('TEST-DEL-002', 'TEST-ORD-002', 'TEST-PAV-001', 1600::bigint)
) AS seed(delivery_number, order_number, product_code, quantity)
JOIN deliveries d ON d.delivery_number = seed.delivery_number
JOIN orders o ON o.order_number = seed.order_number
JOIN products p ON p.product_code = seed.product_code
JOIN order_items oi ON oi.order_id = o.id AND oi.product_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM delivery_items existing
    WHERE existing.delivery_id = d.id AND existing.order_item_id = oi.id
);

INSERT INTO payments (
    customer_id, order_id, payment_date, amount, payment_type, reference_number, remarks
)
SELECT c.id, o.id, CURRENT_DATE, seed.amount, seed.payment_type, seed.reference_number,
       'Development seed record'
FROM (VALUES
    ('TEST-CUST-001', 'TEST-ORD-001', 15000.00::numeric, 'UPI', 'TEST-PAY-001'),
    ('TEST-CUST-002', 'TEST-ORD-002', 20000.00::numeric, 'BANK_TRANSFER', 'TEST-PAY-002')
) AS seed(customer_code, order_number, amount, payment_type, reference_number)
JOIN customers c ON c.customer_code = seed.customer_code
JOIN orders o ON o.order_number = seed.order_number
WHERE NOT EXISTS (
    SELECT 1 FROM payments existing WHERE existing.reference_number = seed.reference_number
);

COMMIT;
