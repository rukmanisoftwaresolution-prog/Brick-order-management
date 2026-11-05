# Brick Order & Customer Management System

## Overview

Brick Order & Customer Management System is an enterprise-grade platform designed to manage the complete brick manufacturing and sales lifecycle.

The application provides:

- Customer Management
- Product Management
- Order Processing
- Production Tracking
- Inventory Management
- Delivery Management
- Payment Tracking
- GST Invoice Generation
- Business Reports
- Dashboard Analytics

---

## Technology Stack

### Backend

- Java 17
- Spring Boot 3.5+
- Spring Security
- JWT
- Hibernate
- PostgreSQL
- Flyway
- Swagger

### Frontend

- Angular 18.2.20
- Angular Material
- Tailwind CSS
- RxJS
- NgRx

### Infrastructure

- Oracle Cloud VM
- PostgreSQL
- NGINX
- Docker

---

## Modules

### Authentication

- Login
- Logout
- Forgot Password
- JWT Authentication

### Customer Management

- Customer Registration
- Customer Ledger
- Outstanding Tracking

### Product Management

- Brick Catalog
- Price Management
- Inventory Integration

### Order Management

- Create Order
- Track Order
- Approval Workflow

### Production Management

- Production Planning
- Daily Production Tracking

### Inventory Management

- Available Stock
- Reserved Stock
- Damaged Stock

### Delivery Management

- Vehicle Assignment
- Delivery Tracking

### Payment Management

- Payment Collection
- Due Tracking

### Invoice Management

- Generate GST Invoice
- PDF Export

### Reporting

- Sales Reports
- Outstanding Reports
- GST Reports

---

## User Roles

| Role | Access |
|--------|--------|
| Admin | Full Access |
| Sales | Customers & Orders |
| Production Manager | Production |
| Dispatch Manager | Delivery |
| Accountant | Payments & Invoices |
| Customer | Order Tracking |

---

## Order Workflow

Draft → Confirmed → Production Planned → In Production → Ready For Dispatch → Dispatched → Delivered → Completed

---

## Deployment Architecture

Angular App → Nginx → Spring Boot API → PostgreSQL

---

## Security

- JWT Authentication
- Role-based Authorization
- Password Encryption (BCrypt)
- Audit Logging

---

## Reporting

- Excel Export
- CSV Export
- PDF Export

---

## Notifications

- Email
- SMS
- WhatsApp

---

## Future Enhancements

- Mobile App
- GPS Vehicle Tracking
- Customer Self-Service Portal
- AI Demand Forecasting
- Multi Factory Support
- Multi Warehouse Support

---

## License

Private Project
