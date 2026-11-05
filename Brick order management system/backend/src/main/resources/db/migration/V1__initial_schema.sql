CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id),
    permission_id BIGINT NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id),
    role_id BIGINT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(30) NOT NULL,
    customer_name VARCHAR(160) NOT NULL,
    customer_type VARCHAR(20) NOT NULL,
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    address VARCHAR(250),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    contact_person VARCHAR(120),
    mobile_number VARCHAR(20),
    email VARCHAR(254),
    credit_limit NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
    outstanding_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (outstanding_amount >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_customers_customer_code UNIQUE (customer_code),
    CONSTRAINT uk_customers_gst_number UNIQUE (gst_number)
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    product_code VARCHAR(30) NOT NULL UNIQUE,
    product_name VARCHAR(120) NOT NULL,
    size VARCHAR(80),
    weight_kg NUMERIC(10,3),
    gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (gst_percentage BETWEEN 0 AND 100),
    current_rate NUMERIC(14,2) NOT NULL CHECK (current_rate >= 0),
    opening_stock BIGINT NOT NULL DEFAULT 0 CHECK (opening_stock >= 0),
    minimum_stock BIGINT NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    order_date DATE NOT NULL,
    required_delivery_date DATE,
    delivery_address VARCHAR(500) NOT NULL,
    transportation_mode VARCHAR(40),
    remarks VARCHAR(1000),
    status VARCHAR(32) NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    discount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    rate NUMERIC(14,2) NOT NULL CHECK (rate >= 0),
    discount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    gst_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    amount NUMERIC(14,2) NOT NULL
);

CREATE TABLE production_entries (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    production_date DATE NOT NULL,
    target_quantity BIGINT NOT NULL DEFAULT 0,
    actual_quantity BIGINT NOT NULL DEFAULT 0,
    rejected_quantity BIGINT NOT NULL DEFAULT 0,
    raw_material_consumption NUMERIC(14,3) NOT NULL DEFAULT 0,
    kiln_name VARCHAR(100),
    machine_name VARCHAR(100),
    remarks VARCHAR(1000),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE REFERENCES products(id),
    available_stock BIGINT NOT NULL DEFAULT 0,
    reserved_stock BIGINT NOT NULL DEFAULT 0,
    damaged_stock BIGINT NOT NULL DEFAULT 0,
    delivered_stock BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (available_stock >= 0 AND reserved_stock >= 0 AND damaged_stock >= 0 AND delivered_stock >= 0)
);

CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    transaction_type VARCHAR(32) NOT NULL,
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    reference_type VARCHAR(40),
    reference_id BIGINT,
    remarks VARCHAR(500),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    vehicle_number VARCHAR(20) NOT NULL UNIQUE,
    driver_name VARCHAR(120) NOT NULL,
    driver_mobile VARCHAR(20),
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    delivery_number VARCHAR(30) NOT NULL UNIQUE,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    vehicle_id BIGINT REFERENCES vehicles(id),
    status VARCHAR(24) NOT NULL,
    dispatch_date TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_address VARCHAR(500) NOT NULL,
    challan_number VARCHAR(30) UNIQUE,
    remarks VARCHAR(1000),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE delivery_items (
    id BIGSERIAL PRIMARY KEY,
    delivery_id BIGINT NOT NULL REFERENCES deliveries(id),
    order_item_id BIGINT NOT NULL REFERENCES order_items(id),
    quantity BIGINT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    order_id BIGINT REFERENCES orders(id),
    payment_date DATE NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_type VARCHAR(24) NOT NULL,
    reference_number VARCHAR(80),
    remarks VARCHAR(500),
    received_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    invoice_date DATE NOT NULL,
    taxable_amount NUMERIC(14,2) NOT NULL,
    cgst NUMERIC(14,2) NOT NULL DEFAULT 0,
    sgst NUMERIC(14,2) NOT NULL DEFAULT 0,
    igst NUMERIC(14,2) NOT NULL DEFAULT 0,
    invoice_amount NUMERIC(14,2) NOT NULL,
    pdf_storage_key VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT REFERENCES customers(id),
    channel VARCHAR(20) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    destination VARCHAR(254) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_name ON customers (lower(customer_name));
CREATE INDEX idx_customers_active ON customers (active);
CREATE INDEX idx_orders_customer_date ON orders (customer_id, order_date DESC);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_order_items_product ON order_items (product_id);
CREATE INDEX idx_production_entries_date ON production_entries (production_date DESC);
CREATE INDEX idx_inventory_transactions_product_date ON inventory_transactions (product_id, created_at DESC);
CREATE INDEX idx_deliveries_order_status ON deliveries (order_id, status);
CREATE INDEX idx_payments_customer_date ON payments (customer_id, payment_date DESC);
CREATE INDEX idx_notifications_status_created ON notifications (status, created_at);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id, created_at DESC);
