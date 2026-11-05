# Database ER Diagram

The V1 Flyway migration creates the schema shown below. This is the initial relational foundation; table coverage does not imply that business workflows or APIs are implemented.

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : assigned
    ROLES ||--o{ ROLE_PERMISSIONS : grants
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : included
    CUSTOMERS ||--o{ ORDERS : places
    USERS o|--o{ ORDERS : creates
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : sold_as
    PRODUCTS ||--o| INVENTORY : stocked_as
    PRODUCTS ||--o{ PRODUCTION_ENTRIES : produced_as
    PRODUCTS ||--o{ INVENTORY_TRANSACTIONS : changes
    ORDERS ||--o{ DELIVERIES : fulfilled_by
    VEHICLES o|--o{ DELIVERIES : assigned
    DELIVERIES ||--|{ DELIVERY_ITEMS : includes
    ORDER_ITEMS ||--o{ DELIVERY_ITEMS : delivered_from
    CUSTOMERS ||--o{ PAYMENTS : pays
    ORDERS o|--o{ PAYMENTS : settles
    ORDERS ||--o| INVOICES : invoiced_by
    CUSTOMERS ||--o{ INVOICES : billed
    CUSTOMERS o|--o{ NOTIFICATIONS : receives
    USERS o|--o{ AUDIT_LOGS : acts

    USERS {
      bigint id PK
      varchar username UK
      varchar email UK
      varchar password_hash
      boolean active
    }
    APP_SETTINGS {
      varchar setting_key PK
      varchar setting_value
      timestamptz updated_at
    }
    ROLES {
      bigint id PK
      varchar name UK
    }
    PERMISSIONS {
      bigint id PK
      varchar name UK
    }
    CUSTOMERS {
      bigint id PK
      varchar customer_code UK
      varchar customer_name
      varchar gst_number UK
      numeric credit_limit
      numeric outstanding_amount
    }
    PRODUCTS {
      bigint id PK
      varchar product_code UK
      varchar product_name
      numeric current_rate
      numeric gst_percentage
    }
    ORDERS {
      bigint id PK
      varchar order_number UK
      bigint customer_id FK
      varchar status
      numeric total_amount
    }
    ORDER_ITEMS {
      bigint id PK
      bigint order_id FK
      bigint product_id FK
      bigint quantity
      numeric rate
      numeric amount
    }
    PRODUCTION_ENTRIES {
      bigint id PK
      bigint product_id FK
      date production_date
      bigint actual_quantity
      bigint rejected_quantity
    }
    INVENTORY {
      bigint id PK
      bigint product_id FK
      bigint available_stock
      bigint reserved_stock
      bigint damaged_stock
    }
    INVENTORY_TRANSACTIONS {
      bigint id PK
      bigint product_id FK
      varchar transaction_type
      bigint quantity
    }
    VEHICLES {
      bigint id PK
      varchar vehicle_number UK
      varchar driver_name
    }
    DELIVERIES {
      bigint id PK
      varchar delivery_number UK
      bigint order_id FK
      bigint vehicle_id FK
      varchar status
    }
    DELIVERY_ITEMS {
      bigint id PK
      bigint delivery_id FK
      bigint order_item_id FK
      bigint quantity
    }
    PAYMENTS {
      bigint id PK
      bigint customer_id FK
      bigint order_id FK
      numeric amount
      varchar payment_type
    }
    INVOICES {
      bigint id PK
      varchar invoice_number UK
      bigint order_id FK
      bigint customer_id FK
      numeric taxable_amount
      numeric invoice_amount
    }
    NOTIFICATIONS {
      bigint id PK
      bigint customer_id FK
      varchar channel
      varchar status
    }
    AUDIT_LOGS {
      bigint id PK
      bigint user_id FK
      varchar action
      varchar entity_type
      jsonb details
    }
```

JPA access must remain through JPQL and Spring Data derived queries. Native SQL is not to be added to repository methods. Flyway SQL is used only for schema evolution and indexes/constraints.
