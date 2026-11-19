# Brickworks ERP User Guide

**Audience:** Business users who operate the Brickworks web application

**Scope:** This guide describes the screens and behavior present in the inspected application source. Labels can vary slightly if a deployment has been customized.

> **Screenshots:** No rendered application page was shared for capture in this session, so this guide does not use mock or misleading images.

## Contents

- [Important Business Rules](#important-business-rules)
1. [Getting started and navigation](#1-getting-started-and-navigation)
2. [Customers](#2-customers)
3. [Products](#3-products)
4. [Orders](#4-orders)
5. [Invoices](#5-invoices)
6. [Payments and customer statements](#6-payments-and-customer-statements)
7. [Deliveries and challans](#7-deliveries-and-challans)
8. [Reports](#8-reports)
9. [Production and inventory](#9-production-and-inventory)
10. [Settings](#10-settings)
11. [Common problems](#11-common-problems)
12. [Current limitations](#12-current-limitations)

## Important Business Rules

- **Local development is not secured deployment.** The default local `dev` profile binds the API to `127.0.0.1` and permits API requests without authentication. Do not expose this profile to a network or the public internet.
- **Secured deployments require sign-in at the API level.** Outside `dev`, the backend uses HTTP Basic authentication. Requests require an active user; payments, invoices, reminders, order confirmation, and delivery-status changes require an administrator role. User accounts and roles must be provisioned by an administrator.
- **The `/login` page is only a placeholder.** It is not a sign-in form and does not create or authenticate accounts. The current UI has no password recovery or account-management workflow.
- **The invoice tax split is provisional.** The application currently splits order tax between CGST and SGST and sets IGST to zero. This is a technical default, not tax advice. Confirm the correct tax treatment with the business and a qualified tax professional before relying on generated invoices.
- **UPI and PhonePe are manually recorded methods.** Selecting either method does not connect to a payment gateway or verify a transaction. Confirm that funds were received through your normal process before recording the payment.
- **Payment totals depend on status.** Invoice settlement, the Payments page's received total, and statement received totals include only `SUCCESSFUL` payments. Reports count and sum all payment statuses in the selected date range. These figures can differ.
- **Reminders are not delivered without a provider.** The application can prepare and submit a reminder request, but no WhatsApp or SMS provider is configured in this project. A request is not a sent message until an administrator configures a provider.
- **Delivered and returned are final delivery statuses.** The current UI has no way to correct either status after it is saved.

## 1. Getting started and navigation

### Access and sign-in

For local development, the default `dev` profile allows unauthenticated API calls and binds the backend to the local computer. This is for development only.

In a secured deployment, the backend uses HTTP Basic authentication. The application does not currently have a working sign-in page: the **/login** route opens a placeholder screen. An administrator must provision the user account and role for API access; there is no in-app password recovery or account setup.

The application opens on **Overview**. Use the left navigation to open:

| Menu | Use |
|---|---|
| Overview | View the dashboard and quick links. |
| Customers | Search and maintain customer accounts. |
| Products | Search the product catalogue and add products. |
| Orders | Create, review, confirm, or delete draft orders. |
| Production | Record daily output and rejected units. |
| Inventory | View stock balances and record adjustments. |
| Deliveries | Create delivery records and challans; view and update delivery status. |
| Payments | Record invoice payments and view customer payment statements. |
| Invoices | Generate and review invoices. |
| Reports | Review operational totals for a date range. |
| Settings | Update profile contact and plant details. |

On a narrow screen, select the menu button in the top bar to open or close navigation. The breadcrumb shows the current section. The profile button opens Settings. The notification button currently opens sample messages, not a live notification feed.

The normal working sequence is:

**Add an active customer and product → create a draft order → confirm it → generate an invoice → record payments → create a delivery record for dispatch.**

You can also record production or inventory adjustments independently. The server validates required fields and business rules. A successful save usually displays a confirmation message and refreshes the list.

## 2. Customers

Open **Customers**. Search by customer name, code, or mobile number; choose **All statuses**, **Active**, or **Inactive**; then select **Search**. Use the page arrows to move through customer results.

### Add a customer

Select **Add customer**, complete the form, and select **Save customer**.

| Field | What to enter |
|---|---|
| Customer code | A unique identifier, up to 30 characters. Required. |
| Customer name | The business or person's name, up to 160 characters. Required. |
| Customer type | **Business** or **Individual**. |
| GST number | Optional GST identifier, up to 15 characters. A GST number cannot be reused for another customer. |
| Contact person | Optional contact name. |
| Mobile number | Optional phone number for contact and reminders. |
| Email | Optional valid email address. |
| Credit limit | Non-negative amount. The screen does not use this field to approve or block orders. |
| City / State | Optional location details. |
| Address | Optional address, up to 250 characters. |
| Pincode | Optional postal code. |
| Active account | Checked means the account is active and can be selected in workflows that require an active customer. |

**Cancel** closes the form without saving. The **X** button also closes it.

### Edit or delete a customer

Select the pencil icon on a customer row to open **Edit customer**. Update the available fields and select **Save customer**. The customer code and GST number must remain unique.

Select the trash icon to request deletion, then confirm the browser prompt. Deletion is permanent. It can be rejected when existing orders, invoices, or payments refer to the customer. Outstanding balance is calculated by the server; it is not editable in this form.

The backend accepts a PAN number, but the current customer form has no visible PAN field. You cannot enter a new PAN number from this screen.

### Send a payment reminder

Select the notification icon on a customer with an outstanding balance. Choose an unpaid or partially paid invoice, review its total, paid amount, and outstanding amount, choose **WhatsApp** or **SMS**, and select **Send reminder**.

The customer must have a mobile number and the invoice must belong to that customer and still have an outstanding balance. **The message is not actually sent until an administrator configures a supported provider.** No provider is configured in this project; a request without one returns an unavailable error. See [Current limitations](#12-current-limitations).

## 3. Products

Open **Products**. Search by product name or code. Select **Add product**, complete the fields, and select **Save product**.

| Field | What to enter |
|---|---|
| Product code | Unique product identifier, up to 30 characters. Required. |
| Product name | Product display name, up to 120 characters. Required. |
| Size | Optional size or product description, up to 80 characters. |
| Weight (kg) | Optional non-negative weight, with up to three decimal places. |
| Rate (₹) | Non-negative unit rate. Required. |
| GST % | GST rate from 0 to 100. Required; this rate is used in order calculations. |
| Opening stock | Non-negative whole-unit starting balance. Required. |
| Minimum stock | Non-negative whole-unit minimum level. Required. |
| Active product | Checked products appear in workflows that require an active product. |

The list displays code, name, size, rate, GST, opening stock, minimum stock, and active status. When a product is created, its opening stock initializes its available inventory balance.

Select **Search** to apply the product name/code text. In the Add product dialog, **Cancel** or the **X** closes the form without saving. The current Products screen does not provide edit or deactivate buttons. Although the backend has update and deactivation operations, those operations are not exposed in this screen.

## 4. Orders

An active customer and active product must exist before an order can be created. Open **Orders** and select **Create order**.

| Field | What to enter |
|---|---|
| Customer | Select the customer for this order. |
| Required delivery date | Optional requested date. |
| Delivery address | Required destination, up to 500 characters. |
| Transportation mode | **Customer pickup**, **Own vehicle**, or **Third party**. |
| Product | Select one active catalogue product. The screen fills the unit rate from the product; you can adjust it. |
| Quantity | Number of units; must be at least 1. |
| Unit rate (₹) | Non-negative price per unit. |
| Discount (₹) | Non-negative line discount. It cannot exceed the line's pre-discount value. |
| Remarks | Optional note, up to 1,000 characters. |

Select **Save draft order** to create the order in **DRAFT** status. The list shows the generated order number, customer, date, item count, total, and status.

Select **Cancel** or the **X** to close the form without saving. For a draft, select **Confirm** to confirm it. Only confirmed, non-cancelled orders without an invoice are eligible for invoice generation. Select the trash icon and confirm the prompt to delete a draft; confirmed orders cannot be deleted from this screen.

### How the order total is calculated

For each line:

1. **Gross line value** = quantity × unit rate.
2. **Taxable line value** = gross line value − discount.
3. **Line GST** = taxable line value × product GST rate, rounded to two decimal places.
4. **Order total** = subtotal − discounts + taxes.

**Example:** 1,000 units at ₹10 each gives a gross value of ₹10,000. With a ₹200 discount and 5% GST, taxable value is ₹9,800, tax is ₹490, and the total is **₹10,290**.

The current order form supports one product line per order submission. It does not show a live total preview before saving.

## 5. Invoices

Open **Invoices** to review issued invoices. Search by invoice number, order number, or customer name. Use **Previous** and **Next** to browse pages.

Select **Generate invoice**. The dialog loads eligible confirmed orders. Choose an order and select **Generate invoice**. If the dialog says no orders are eligible, confirm an order first or check whether it already has an invoice.

On the invoice list, enter a search term and select **Search** (or press Enter); use **Previous** and **Next** to change pages. In the generation dialog, **Cancel** or the **X** closes the dialog without creating an invoice.

An order can have only one invoice. Invoice generation uses the order's server-calculated total; users do not enter invoice amounts or tax values. The current tax assumption splits the order's tax equally between CGST and SGST (with any rounding remainder assigned to SGST); IGST is zero. **This split is provisional and must be confirmed by the business and a qualified tax professional before using generated invoices for tax or compliance purposes.** It is an application default, not a tax determination.

The list displays invoice number and date, customer and order, taxable amount, CGST, SGST, IGST, total, payment status, and amount due. Payment status is **UNPAID**, **PARTIALLY_PAID**, or **PAID**, based on successful payments.

## 6. Payments and customer statements

### Record an invoice payment

Open **Payments** and select **Record payment**.

| Field | What to do |
|---|---|
| Customer | Select an active customer. |
| Invoice | Select one of that customer's unpaid or partially paid invoices. The summary shows invoice total, already paid, amount due, and status. |
| Amount (₹) | Enter an amount greater than zero and no more than the current amount due. A smaller amount records a partial payment. |
| Payment date | Enter the business date of the receipt. The server does not accept a future payment date. |
| Payment method | Choose **Cash**, **UPI**, **PhonePe**, **Bank transfer**, **Other**, or **Cheque**. |
| Reference number | Optional transaction or cheque reference, up to 80 characters. |
| Remarks | Optional note, up to 500 characters. |

Select **Record payment** to save. The server marks a receipt entered through this administrator workflow as **SUCCESSFUL**, updates the invoice balance, and prevents duplicate submissions using a request key and payment reference checks. **Cancel** or the **X** closes the form.

**UPI and PhonePe are manual payment-method labels only.** The application does not contact a bank, UPI app, PhonePe, or other payment gateway to verify a transaction. Check that the payment was received outside the application before recording it; saving the form marks it successful.

**Partial-payment example:** If an invoice is ₹10,290 and ₹4,000 has already been paid, the amount due is ₹6,290. Recording ₹2,500 makes the total paid ₹6,500 and leaves **₹3,790** due. A later payment can settle the remaining balance.

The Payments screen's **Total received**, invoice settlement, and the customer statement's **Successful payments received** total count only successful payments. The current form requires an invoice; it does not provide an option to record an advance payment without an invoice. The table loads the latest 50 payments; the customer statement separately loads that customer's complete history.

### View a customer-wise Payment Statement

Select a customer's clickable name in the Payments table. The statement loads that customer's history from the server and shows:

- Customer name and code.
- Number of transactions, including transactions that are not successful.
- Total amount from **SUCCESSFUL** payments only.
- Each payment's business payment date and its saved creation timestamp.
- Invoice number or an advance-payment label, order when available, method, reference, status, and amount.

The exact saved creation timestamp is displayed in **Asia/Kolkata** time. It is separate from the payment date: `paymentDate` is the business date; `createdAt` is the saved timestamp. Statements are ordered newest first. Select **Close**, the **X**, or the shaded background to close the dialog. If no records exist, the dialog displays an empty state.

## 7. Deliveries and challans

Open **Deliveries** and select **Create delivery**. Choose an eligible order, then choose an order line and quantity. The quantity cannot exceed the order line's remaining quantity across non-returned deliveries.

| Field | What to enter |
|---|---|
| Order | Select an active order available for dispatch. Draft or cancelled orders cannot be dispatched. |
| Order line | Select the product line from that order. |
| Quantity | Number of units on this delivery. Must be at least 1 and within the remaining order quantity. |
| Vehicle | Optional. Choose an active vehicle or leave **Unassigned**. |
| Delivery address | Required; defaults to the selected order's address and can be changed for this delivery. |
| Remarks | Optional delivery note. |

Select **Create challan** to create the delivery record. The system assigns a delivery number and challan number; the initial status is **PENDING**. Select either number in the list to view the record, customer, order, vehicle and driver, address, creation time, status, and item quantities. **Close** returns to the list.

In the creation dialog, **Cancel** or the **X** closes the form without creating a delivery.

### Update a delivery status

Open a delivery's details. The available status actions follow this sequence:

| Current status | Available next status |
|---|---|
| PENDING | LOADING |
| LOADING | IN_TRANSIT or RETURNED |
| IN_TRANSIT | DELIVERED or RETURNED |
| DELIVERED | No further change |
| RETURNED | No further change |

Choose the offered action. The application asks for confirmation before marking a delivery **DELIVERED** or **RETURNED**. Choose **Confirm** to submit or **Cancel** to leave the status unchanged. **DELIVERED** and **RETURNED** are final statuses. They cannot currently be corrected through the UI; contact an administrator if one was recorded in error.

The challan is a record view in the application. The current screen does not generate or download a challan PDF.

## 8. Reports

Open **Reports**. The date filters default to the first day of the current month through today. Change **From** and/or **To**, then select **Apply dates**. The start date must not be later than the end date.

The report displays:

- **Orders:** count and order value for matching order dates. The query includes orders regardless of status.
- **Payments:** count and amount for matching payment dates. The report includes all payment statuses, including any pending, failed, or reversed records. It does not show a successful-only total. This can differ from invoice settlement and the Payments page or statement, which count only successful payments.
- **Deliveries:** count of deliveries created in the range.
- **Production entries:** entry count, actual produced quantity, and rejected quantity.
- **Current inventory:** product count and current available, reserved, damaged, and delivered balances.

Inventory is a current snapshot and is not filtered by the selected dates. The report screen has no export or download action. Delivery date filtering uses the server's UTC timestamp boundaries, so a delivery created near midnight local time may appear in an adjacent date range.

## 9. Production and inventory

These pages support operational records used by inventory and reporting.

### Record production

In **Production**, select **Record production** and enter:

- **Product:** active product being produced.
- **Production date:** date of the production entry.
- **Target quantity:** planned output.
- **Actual quantity:** produced output.
- **Rejected quantity:** rejected output; cannot exceed actual quantity.
- **Raw material consumption:** non-negative recorded consumption.
- **Kiln / Machine:** optional equipment names.
- **Remarks:** optional note.

Select **Save entry**. **Cancel** or the **X** closes the form without saving. Accepted output is calculated as **actual − rejected** and added to available inventory in the same transaction. The list shows target, actual, rejected, accepted, and equipment details.

### Adjust inventory

In **Inventory**, select **Adjust stock**:

- Choose a product.
- Choose an adjustment type: **Receive stock**, **Record damaged stock**, **Stocktake increase**, or **Stocktake decrease**.
- Enter a whole-unit quantity of at least 1.
- Enter a reason; this is required and is stored in the stock ledger.

Select **Apply adjustment**. Receiving stock and stocktake increases add to available stock. Recording damage reduces available stock and adds the quantity to damaged stock. A stocktake decrease reduces available stock. Decreases cannot exceed the available balance. Cancel or the **X** closes the dialog.

The inventory list shows available, reserved, damaged, and delivered balances and the last update time. The screen does not expose a transaction-ledger view.

## 10. Settings

Open **Settings** to update the profile and plant fields. Select **Save settings** to save; the read-only **Role** field cannot be changed here.

| Section and field | What it controls |
|---|---|
| Profile — Display name | Name shown in the workspace. Required. |
| Profile — Email | Contact email; must be valid. Required. |
| Profile — Mobile number | Optional contact number. |
| Profile — Role | Read-only role shown for the current profile. |
| Plant — Plant name | Required operating-site name. |
| Plant — Plant status | **Operational**, **Attention required**, or **Offline**. |
| Plant — Plant address | Optional address. |

Settings are saved to the configured application database. The application does not provide account or role management in this screen.

## 11. Common problems

| Message or situation | What to check |
|---|---|
| Required-field or invalid-value message | Complete all required fields. Check that rates, credit limits, quantities, GST percentages, and discounts are in their allowed ranges. |
| Customer or product is not available in a selector | Check that it exists and is active. Orders and production require active catalogue records. |
| Duplicate customer or product code / GST number | Use a unique customer code, product code, and GST number. |
| No invoices available for payment | The selected customer may have no unpaid or partially paid invoices. Generate an invoice from a confirmed eligible order first. |
| Payment exceeds amount due | Refresh the invoice selection and use an amount no greater than the current outstanding balance. |
| Payment reference or duplicate submission conflict | Confirm that the payment was not already recorded. Do not retry with a different value until you have checked the payment list and statement. |
| No order eligible for invoice | Confirm the draft order. An order can have only one invoice. |
| Delivery quantity rejected | Check the selected order line and reduce the quantity to its remaining undelivered amount. |
| Cannot update a delivery | Only the next allowed status is offered. Delivered and returned deliveries are final. |
| Inventory decrease rejected | Reduce the adjustment quantity so it does not exceed available stock. |
| No reminder provider / HTTP 503 | WhatsApp/SMS delivery requires an installed and configured provider. Contact the system administrator; the current project has none configured. |
| Report rejects the date range | Set **From** to the same date as or an earlier date than **To**. |
| Access denied or repeated sign-in prompt | Access depends on the environment. The production API requires an active user and appropriate role; contact the administrator rather than trying an assumed password. |
| Page cannot load data | Check that the backend and database are available, refresh the page, and report the displayed error to the administrator. |

The API uses a standard error response. Common status meanings are **400** invalid input or stored-data constraint, **401/403** authentication or permission required, **404** record not found, **409** business-rule conflict, and **503** integration unavailable.

## 12. Current limitations

The following are visible limitations of the inspected application; do not treat them as available features:

- Overview metrics, recent-order rows, revenue chart data, notification messages, and the Orders navigation count are sample values in the frontend. They are not live operational totals.
- The default local `dev` profile binds the backend to loopback and permits unauthenticated API requests. Do not use it as a secured deployment. Outside `dev`, API requests use HTTP Basic authentication; all requests require an active user, with an administrator role required for payments, invoices, reminders, order confirmation, and delivery-status changes. The **/login** route is a placeholder, not a login workflow, and there is no password recovery or account/role-management UI.
- The Products screen supports create, search, and list, but does not expose the backend's product update or deactivate actions.
- The Customer form has no visible PAN input, although the backend request accepts PAN.
- Product and order lists load up to 100 and 50 records respectively and do not provide list pagination. The order list has no search control; it loads recent orders.
- The Orders form records one product line per order submission.
- The Payments form records invoice-linked receipts only. It does not provide advance-payment entry, payment gateway reconciliation, automatic UPI/PhonePe verification, or user selection of PENDING/FAILED status. The screen does not offer statement export; methods such as UPI and PhonePe are manually recorded.
- The Deliveries and Production lists load up to 50 records each; the Inventory list loads up to 100. These screens do not provide list pagination.
- Invoice PDF creation, printing, emailing, and voiding are not available.
- The delivery challan is an in-app record, not a generated PDF. DELIVERED and RETURNED are final and cannot currently be corrected through the UI.
- WhatsApp/SMS reminder providers are not configured. Reminder requests are not actually sent and may return HTTP 503 until a provider is configured.
- Reports have no export feature. Payment report totals count all matching statuses; invoice settlement and Payments/statement received totals count successful payments only.
- Vehicle lookup is available during delivery creation, but vehicle/driver management is not exposed in the current application.
- Production records capture raw material consumption, but the current UI does not provide raw-material inventory tracking.

## Source verification notes

This guide was checked against the Angular routes and page components, Angular API services, Spring Boot controllers and services, request/response models, payment and delivery rules, report queries, security configuration, README, and API contract documentation in this workspace. The implementation is in progress; the limitations above distinguish real screens from API-only or placeholder behavior.

