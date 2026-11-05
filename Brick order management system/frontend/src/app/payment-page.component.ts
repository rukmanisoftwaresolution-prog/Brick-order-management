import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import { Customer, CustomerApiService } from './customer-api.service';
import { LogisticsApiService, Payment, PaymentRequest } from './logistics-api.service';
import { ProductOrderApiService, SalesOrder } from './product-order-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="ops-page">
      <header class="page-heading"><div><p class="eyebrow">OPERATIONS / PAYMENTS</p><h1>Payments</h1><p class="description">Collected payments and order references.</p></div><button class="primary-action" type="button" (click)="openForm()"><mat-icon>add</mat-icon>Record payment</button></header>
      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> } @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      <div class="metric-row"><article><span>Payments shown</span><strong>{{ payments().length }}</strong></article><article><span>Total received</span><strong>{{ totalReceived() | currency:'INR':'symbol':'1.2-2' }}</strong></article></div>
      <section class="table-panel">@if (loading()) { <p class="empty">Loading payments...</p> } @else if (payments().length === 0) { <p class="empty">No payments recorded.</p> } @else { <div class="table-scroll"><table><thead><tr><th>DATE</th><th>CUSTOMER</th><th>ORDER</th><th>METHOD</th><th>REFERENCE</th><th>AMOUNT</th></tr></thead><tbody>@for (payment of payments(); track payment.id) { <tr><td>{{ payment.paymentDate | date:'dd MMM yyyy' }}</td><td>{{ payment.customerName }}<small>{{ payment.customerCode }}</small></td><td>{{ payment.orderNumber || 'Advance' }}</td><td>{{ payment.paymentType.replace('_', ' ') }}</td><td>{{ payment.referenceNumber || '—' }}</td><td class="money">{{ payment.amount | currency:'INR':'symbol':'1.2-2' }}</td></tr> }</tbody></table></div> }</section>
      @if (formOpen()) { <div class="backdrop" (click)="formOpen.set(false)"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="payment-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">RECEIPT ENTRY</p><h2 id="payment-title">Record payment</h2></div><button class="close" type="button" aria-label="Close" (click)="formOpen.set(false)"><mat-icon>close</mat-icon></button></header>
        @if (formError()) { <p class="feedback error" role="alert">{{ formError() }}</p> }
        <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
          <label class="wide">Customer<select formControlName="customerId" (change)="customerChanged()" required><option [ngValue]="null">Select customer</option>@for (customer of customers(); track customer.id) { <option [ngValue]="customer.id">{{ customer.customerCode }} · {{ customer.customerName }}</option> }</select></label>
          <label class="wide">Apply to order<select formControlName="orderId"><option [ngValue]="null">Advance / not linked to order</option>@for (order of customerOrders(); track order.id) { <option [ngValue]="order.id">{{ order.orderNumber }} · {{ order.totalAmount | currency:'INR':'symbol':'1.2-2' }} · {{ order.status }}</option> }</select></label>
          <label>Amount (₹)<input type="number" formControlName="amount" min="0.01" step="0.01" required></label>
          <label>Payment method<select formControlName="paymentType"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="BANK_TRANSFER">Bank transfer</option><option value="CHEQUE">Cheque</option></select></label>
          <label>Reference number<input formControlName="referenceNumber" maxlength="80"></label>
          <label class="wide">Remarks<input formControlName="remarks" maxlength="500"></label>
        </div><p class="stock-note">Payments linked to an order cannot exceed its remaining balance. Payments are append-only.</p><footer><button class="secondary-action" type="button" (click)="formOpen.set(false)">Cancel</button><button class="primary-action" type="submit" [disabled]="saving()"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Record payment' }}</button></footer></form>
      </section></div> }
    </section>
  `,
  styles: [`
    :host{display:block;--line:#e6e9e5;--muted:#7b8680}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}.eyebrow{margin:0 0 8px;color:#829088;font-size:9px;font-weight:700;letter-spacing:1px}h1{margin:0;color:#20332a;font:700 26px Manrope,sans-serif}.description{margin:8px 0 0;color:var(--muted);font-size:12px}.primary-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:0 13px;border:0;border-radius:5px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{color:#fff;background:#24554b}.primary-action:disabled{opacity:.6}.primary-action mat-icon{width:17px;height:17px;font-size:17px}.secondary-action{color:#41564b;background:#fff;border:1px solid #dfe5df}.metric-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}.metric-row article{display:grid;gap:8px;padding:14px;background:#fff;border:1px solid var(--line);border-radius:6px;color:#7a877f;font-size:10px}.metric-row strong{color:#273a31;font:700 20px Manrope,sans-serif}.table-panel{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:7px}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{padding:12px;color:#89948d;background:#fafbf9;border-bottom:1px solid var(--line);font-size:8px;letter-spacing:.6px}td{padding:12px;color:#58675e;border-bottom:1px solid #eef0ed;font-size:10px}td small{display:block;margin-top:4px;color:#929b95;font-size:9px}.money{color:#327557;font-weight:700}.empty{min-height:130px;display:grid;place-items:center;color:#77827b;font-size:11px}.feedback{margin:0 0 12px;padding:10px 12px;border-radius:5px;font-size:11px}.feedback.success{color:#286346;background:#edf6ef}.feedback.error{color:#9d4c38;background:#fbefeb}.backdrop{position:fixed;z-index:50;inset:0;display:grid;place-items:center;padding:18px;background:#15251f66}.dialog{width:min(600px,100%);max-height:90vh;overflow:auto;padding:20px;background:#fff;border-radius:7px;box-shadow:0 20px 60px #10201833}.dialog header{display:flex;justify-content:space-between;margin-bottom:16px}.dialog h2{margin:0;color:#20332a;font:700 20px Manrope,sans-serif}.close{border:0;background:transparent;color:#65756b;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 13px}.form-grid label{display:grid;gap:5px;color:#647168;font-size:10px;font-weight:600}.form-grid input,.form-grid select{width:100%;height:35px;padding:0 9px;background:#fff;border:1px solid #dfe5df;border-radius:4px;font-size:11px}.form-grid .wide{grid-column:1/-1}.stock-note{padding:10px;color:#53705e;background:#f1f6f1;border-radius:4px;font-size:10px}.dialog footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}@media(max-width:560px){.page-heading{align-items:flex-start;flex-direction:column}.metric-row{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}}
  `]
})
export class PaymentPageComponent implements OnInit {
  private readonly api = inject(LogisticsApiService);
  private readonly customerApi = inject(CustomerApiService);
  private readonly ordersApi = inject(ProductOrderApiService);
  private readonly fb = inject(FormBuilder);
  readonly payments = signal<Payment[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly orders = signal<SalesOrder[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  readonly totalReceived = () => this.payments().reduce((sum, payment) => sum + payment.amount, 0);
  readonly customerOrders = () => this.orders().filter((order) => order.customerId === this.form.controls.customerId.value && !['DRAFT', 'CANCELLED'].includes(order.status));
  readonly form = this.fb.group({ customerId: [null as number | null, Validators.required], orderId: [null as number | null], amount: [0, [Validators.required, Validators.min(0.01)]], paymentType: ['CASH' as PaymentRequest['paymentType'], Validators.required], referenceNumber: [''], remarks: [''] });

  ngOnInit(): void {
    this.load();
    forkJoin({ customers: this.customerApi.list('', 'true', 0, 100), orders: this.ordersApi.orders() }).subscribe({ next: (result) => { this.customers.set(result.customers.data.content); this.orders.set(result.orders.data.content); }, error: () => this.error.set('Could not load customers and orders.') });
  }

  load(): void {
    this.loading.set(true);
    this.api.payments().subscribe({ next: (response) => { this.payments.set(response.data.content); this.loading.set(false); }, error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not load payments.'); this.loading.set(false); } });
  }

  openForm(): void { this.formError.set(''); this.form.reset({ customerId: null, orderId: null, amount: 0, paymentType: 'CASH', referenceNumber: '', remarks: '' }); this.formOpen.set(true); }
  customerChanged(): void { this.form.controls.orderId.setValue(null); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.formError.set('Select a customer and enter a positive amount.'); return; }
    const value = this.form.getRawValue();
    const request: PaymentRequest = { customerId: Number(value.customerId), orderId: value.orderId === null ? null : Number(value.orderId), amount: Number(value.amount), paymentType: value.paymentType!, referenceNumber: value.referenceNumber ?? '', remarks: value.remarks ?? '' };
    this.saving.set(true);
    this.api.createPayment(request).subscribe({ next: (response) => { this.message.set(response.message); this.saving.set(false); this.formOpen.set(false); this.load(); }, error: (error: HttpErrorResponse) => { this.formError.set(error.error?.message ?? 'Could not record payment.'); this.saving.set(false); } });
  }
}
