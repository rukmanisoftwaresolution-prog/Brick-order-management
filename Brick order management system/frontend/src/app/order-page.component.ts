import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Customer, CustomerApiService } from './customer-api.service';
import { OrderRequest, Product, ProductOrderApiService, SalesOrder } from './product-order-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="orders-page">
      <header class="page-heading"><div><p class="eyebrow">OPERATIONS / ORDERS</p><h1>Orders</h1><p class="description">Draft orders and customer order history.</p></div><button class="primary-action" type="button" (click)="openCreate()"><mat-icon>add</mat-icon>Create order</button></header>
      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> }
      @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      <section class="order-list">
        @if (loading()) { <p class="empty">Loading orders...</p> }
        @else if (orders().length === 0) { <p class="empty">No orders found.</p> }
        @else { <div class="table-scroll"><table><thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>ITEMS</th><th>TOTAL</th><th>STATUS</th><th><span class="visually-hidden">Actions</span></th></tr></thead><tbody>@for (order of orders(); track order.id) { <tr><td><strong>{{ order.orderNumber }}</strong></td><td>{{ order.customerName }}</td><td>{{ order.orderDate | date:'dd MMM yyyy' }}</td><td>{{ order.items.length }}</td><td>{{ order.totalAmount | currency:'INR':'symbol':'1.2-2' }}</td><td><span class="status-pill">{{ order.status }}</span></td><td class="actions">@if (order.status === 'DRAFT') { <button type="button" class="confirm-order" [disabled]="saving()" [attr.aria-label]="'Confirm order ' + order.orderNumber" (click)="confirmOrder(order)">Confirm</button><button type="button" class="delete-draft" [attr.aria-label]="'Delete draft ' + order.orderNumber" title="Delete draft" (click)="deleteDraft(order)"><mat-icon>delete_outline</mat-icon></button> }</td></tr> }</tbody></table></div> }
      </section>
      @if (formOpen()) { <div class="backdrop" (click)="formOpen.set(false)"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="order-form-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">NEW DRAFT</p><h2 id="order-form-title">Create order</h2></div><button type="button" class="icon-button" aria-label="Close" (click)="formOpen.set(false)"><mat-icon>close</mat-icon></button></header>
        @if (formError()) { <p class="feedback error" role="alert">{{ formError() }}</p> }
        @if (customers().length === 0 || products().length === 0) { <p class="feedback error">Add an active customer and product before creating an order.</p> }
        <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
          <label>Customer<select formControlName="customerId" required><option [ngValue]="null">Select customer</option>@for (customer of customers(); track customer.id) { <option [ngValue]="customer.id">{{ customer.customerCode }} · {{ customer.customerName }}</option> }</select></label>
          <label>Required delivery date<input type="date" formControlName="requiredDeliveryDate"></label>
          <label class="wide">Delivery address<input formControlName="deliveryAddress" maxlength="500" required></label>
          <label>Transportation mode<select formControlName="transportationMode"><option value="CUSTOMER_PICKUP">Customer pickup</option><option value="OWN_VEHICLE">Own vehicle</option><option value="THIRD_PARTY">Third party</option></select></label>
          <label>Product<select formControlName="productId" (change)="updateRate()" required><option [ngValue]="null">Select product</option>@for (product of products(); track product.id) { <option [ngValue]="product.id">{{ product.productCode }} · {{ product.productName }} · {{ product.currentRate | currency:'INR':'symbol':'1.2-2' }}</option> }</select></label>
          <label>Quantity<input type="number" formControlName="quantity" min="1" step="1" required></label>
          <label>Unit rate (₹)<input type="number" formControlName="rate" min="0" step="0.01" required></label>
          <label>Discount (₹)<input type="number" formControlName="discount" min="0" step="0.01" required></label>
          <label class="wide">Remarks<input formControlName="remarks" maxlength="1000"></label>
        </div><footer><button type="button" class="secondary-action" (click)="formOpen.set(false)">Cancel</button><button type="submit" class="primary-action" [disabled]="saving() || customers().length === 0 || products().length === 0"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Save draft order' }}</button></footer></form>
      </section></div> }
    </section>
  `,
  styles: [`
    :host { display:block; --line:#e6e9e5; --muted:#7b8680; }.page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin-bottom:22px; }.eyebrow { margin:0 0 8px; color:#829088; font-size:9px; font-weight:700; letter-spacing:1px; }h1 { margin:0; color:#20332a; font:700 26px Manrope,sans-serif; }.description { margin:8px 0 0; color:var(--muted); font-size:12px; }.primary-action,.secondary-action { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:37px; padding:0 13px; border:0; border-radius:5px; font:600 11px 'DM Sans',sans-serif; cursor:pointer; }.primary-action { color:#fff; background:#24554b; }.primary-action:disabled { opacity:.6; }.primary-action mat-icon { width:17px; height:17px; font-size:17px; }.secondary-action { color:#41564b; background:#fff; border:1px solid #dfe5df; }.order-list { overflow:hidden; background:#fff; border:1px solid var(--line); border-radius:7px; }.table-scroll { overflow-x:auto; }table { width:100%; border-collapse:collapse; text-align:left; white-space:nowrap; }th { padding:12px 14px; color:#89948d; background:#fafbf9; border-bottom:1px solid var(--line); font-size:8px; letter-spacing:.6px; }td { padding:12px 14px; color:#58675e; border-bottom:1px solid #eef0ed; font-size:10px; }td strong { color:#2b3d34; }.status-pill { padding:4px 7px; color:#9b7240; background:#fbf3e7; border-radius:4px; font-size:9px; }.actions{display:flex;align-items:center;gap:6px}.confirm-order{padding:5px 8px;color:#24554b;background:#eff6f0;border:1px solid #dce9de;border-radius:4px;font-size:9px;cursor:pointer}.confirm-order:disabled{opacity:.6}.delete-draft { display:grid; place-items:center; width:28px; height:28px; color:#9d5a48; background:transparent; border:0; border-radius:4px; cursor:pointer; }.delete-draft:hover { background:#fbefeb; }.delete-draft mat-icon { width:17px; height:17px; font-size:17px; }.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }.empty { min-height:140px; display:grid; place-items:center; color:#77827b; font-size:11px; }.feedback { margin:0 0 12px; padding:10px 12px; border-radius:5px; font-size:11px; }.feedback.success { color:#286346; background:#edf6ef; }.feedback.error { color:#9d4c38; background:#fbefeb; }.backdrop { position:fixed; z-index:50; inset:0; display:grid; place-items:center; padding:18px; background:#15251f66; }.dialog { width:min(660px,100%); max-height:90vh; overflow:auto; padding:20px; background:#fff; border-radius:7px; box-shadow:0 20px 60px #10201833; }.dialog header { display:flex; justify-content:space-between; margin-bottom:16px; }.dialog h2 { margin:0; color:#20332a; font:700 20px Manrope,sans-serif; }.icon-button { border:0; background:transparent; color:#65756b; cursor:pointer; }.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px 13px; }.form-grid label { display:grid; gap:5px; color:#647168; font-size:10px; font-weight:600; }.form-grid input,.form-grid select { width:100%; height:35px; padding:0 9px; background:#fff; border:1px solid #dfe5df; border-radius:4px; font-size:11px; }.form-grid .wide { grid-column:1/-1; }.dialog footer { display:flex; justify-content:flex-end; gap:8px; margin-top:19px; }
    @media (max-width:560px) { .page-heading { align-items:flex-start; flex-direction:column; }.form-grid { grid-template-columns:1fr; }.form-grid .wide { grid-column:auto; } }
  `]
})
export class OrderPageComponent implements OnInit {
  private readonly api = inject(ProductOrderApiService);
  private readonly customerApi = inject(CustomerApiService);
  private readonly fb = inject(FormBuilder);
  readonly orders = signal<SalesOrder[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  readonly form = this.fb.group({
    customerId: [null as number | null, Validators.required],
    requiredDeliveryDate: [''],
    deliveryAddress: ['', [Validators.required, Validators.maxLength(500)]],
    transportationMode: ['CUSTOMER_PICKUP', Validators.required],
    remarks: ['', Validators.maxLength(1000)],
    productId: [null as number | null, Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    rate: [0, [Validators.required, Validators.min(0)]],
    discount: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    this.loadOrders();
    forkJoin({
      customers: this.customerApi.list('', 'true', 0, 100),
      products: this.api.products()
    }).subscribe({
      next: (result) => { this.customers.set(result.customers.data.content); this.products.set(result.products.data.content.filter((product) => product.active)); },
      error: () => this.error.set('Could not load active customers and products.')
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    this.api.orders().subscribe({
      next: (response) => { this.orders.set(response.data.content); this.loading.set(false); },
      error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not load orders.'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.formError.set('');
    this.form.reset({ customerId: null, requiredDeliveryDate: '', deliveryAddress: '', transportationMode: 'CUSTOMER_PICKUP', remarks: '', productId: null, quantity: 1, rate: 0, discount: 0 });
    this.formOpen.set(true);
  }

  updateRate(): void {
    const productId = this.form.controls.productId.value;
    const product = this.products().find((item) => item.id === productId);
    if (product) this.form.controls.rate.setValue(product.currentRate);
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.formError.set('Choose a customer and product, enter a delivery address and valid quantity.'); return; }
    const value = this.form.getRawValue();
    const request: OrderRequest = {
      customerId: Number(value.customerId),
      requiredDeliveryDate: value.requiredDeliveryDate || null,
      deliveryAddress: value.deliveryAddress ?? '',
      transportationMode: value.transportationMode ?? 'CUSTOMER_PICKUP',
      remarks: value.remarks ?? '',
      items: [{ productId: Number(value.productId), quantity: Number(value.quantity), rate: Number(value.rate), discount: Number(value.discount) }]
    };
    this.saving.set(true);
    this.api.createOrder(request).subscribe({
      next: (response) => { this.message.set(`${response.message} ${response.data.orderNumber}: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(response.data.totalAmount)}.`); this.saving.set(false); this.formOpen.set(false); this.loadOrders(); },
      error: (error: HttpErrorResponse) => { this.formError.set(error.error?.message ?? 'Could not create order.'); this.saving.set(false); }
    });
  }

  deleteDraft(order: SalesOrder): void {
    if (!window.confirm(`Delete draft ${order.orderNumber}?`)) return;
    this.api.deleteDraft(order.id).subscribe({
      next: (response) => { this.message.set(response.message); this.loadOrders(); },
      error: (error: HttpErrorResponse) => this.error.set(error.error?.message ?? 'Could not delete draft order.')
    });
  }

  confirmOrder(order: SalesOrder): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.api.confirmOrder(order.id).subscribe({
      next: (response) => { this.message.set(response.message); this.saving.set(false); this.loadOrders(); },
      error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not confirm order.'); this.saving.set(false); }
    });
  }
}
