import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, catchError, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Customer, CustomerApiService } from './customer-api.service';
import { LogisticsApiService, Payment, PaymentRequest } from './logistics-api.service';
import { Invoice, InvoiceApiService } from './invoice-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="ops-page">
      <header class="page-heading"><div><p class="eyebrow">OPERATIONS / PAYMENTS</p><h1>Payments</h1><p class="description">Successful receipts applied to customer invoices.</p></div><button class="primary-action" type="button" (click)="openForm()"><mat-icon>add</mat-icon>Record payment</button></header>
      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> } @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      <div class="metric-row"><article><span>Payments shown</span><strong>{{ payments().length }}</strong></article><article><span>Total received</span><strong>{{ totalReceived() | currency:'INR':'symbol':'1.2-2' }}</strong></article></div>
      <section class="table-panel">@if (loading()) { <p class="empty">Loading payments...</p> } @else if (payments().length === 0) { <p class="empty">No payments recorded.</p> } @else { <div class="table-scroll"><table><thead><tr><th>DATE</th><th>CUSTOMER</th><th>INVOICE / ORDER</th><th>METHOD</th><th>STATUS</th><th>REFERENCE</th><th>AMOUNT</th></tr></thead><tbody>@for (payment of payments(); track payment.id) { <tr><td>{{ payment.paymentDate | date:'dd MMM yyyy' }}</td><td><button class="customer-link" type="button" (click)="openStatement(payment)">{{ payment.customerName }}</button><small>{{ payment.customerCode }}</small></td><td>{{ payment.invoiceNumber || payment.orderNumber || 'Advance' }}</td><td>{{ payment.paymentType.replace('_', ' ') }}</td><td>{{ payment.paymentStatus }}</td><td>{{ payment.referenceNumber || '—' }}</td><td class="money">{{ payment.amount | currency:'INR':'symbol':'1.2-2' }}</td></tr> }</tbody></table></div> }</section>
      @if (statementOpen()) { <div class="backdrop" (click)="closeStatement()"><section class="dialog statement-dialog" role="dialog" aria-modal="true" aria-labelledby="statement-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">CUSTOMER ACCOUNT</p><h2 id="statement-title">Payment Statement</h2>@if (statementCustomer(); as customer) { <p class="statement-customer">{{ customer.customerName }} <small>{{ customer.customerCode }}</small></p> }</div><button class="close" type="button" aria-label="Close payment statement" (click)="closeStatement()"><mat-icon>close</mat-icon></button></header>
        @if (statementError()) { <p class="feedback error" role="alert">{{ statementError() }}</p> }
        @if (statementLoading()) { <p class="empty">Loading payment history...</p> }
        @else if (!statementError()) {
          <div class="statement-summary"><article><span>Transactions</span><strong>{{ statementPayments().length }}</strong></article><article><span>Successful payments received</span><strong>{{ statementTotalReceived() | currency:'INR':'symbol':'1.2-2' }}</strong></article></div>
          @if (statementPayments().length === 0) { <p class="empty">No payment history for this customer.</p> }
          @else { <div class="table-scroll"><table class="statement-table"><thead><tr><th>PAYMENT DATE</th><th>INVOICE / ADVANCE</th><th>ORDER</th><th>METHOD</th><th>REFERENCE</th><th>STATUS</th><th>AMOUNT</th></tr></thead><tbody>@for (payment of statementPayments(); track payment.id) { <tr><td>{{ payment.paymentDate | date:'dd MMM yyyy' }}<small>{{ payment.createdAt | date:'dd MMM yyyy, hh:mm:ss a':'+0530' }} IST</small></td><td>{{ payment.invoiceNumber || 'Advance payment' }}</td><td>{{ payment.orderNumber || '—' }}</td><td>{{ payment.paymentType.replace('_', ' ') }}</td><td>{{ payment.referenceNumber || '—' }}</td><td>{{ payment.paymentStatus }}</td><td class="money">{{ payment.amount | currency:'INR':'symbol':'1.2-2' }}</td></tr> }</tbody></table></div> }
        }
        <footer><button class="secondary-action" type="button" (click)="closeStatement()">Close</button></footer>
      </section></div> }
      @if (formOpen()) { <div class="backdrop" (click)="formOpen.set(false)"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="payment-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">RECEIPT ENTRY</p><h2 id="payment-title">Record payment</h2></div><button class="close" type="button" aria-label="Close" (click)="formOpen.set(false)"><mat-icon>close</mat-icon></button></header>
        @if (formError()) { <p class="feedback error" role="alert">{{ formError() }}</p> }
        <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
          <label class="wide">Customer<select formControlName="customerId" (change)="customerChanged()" required><option [ngValue]="null">Select customer</option>@for (customer of customers(); track customer.id) { <option [ngValue]="customer.id">{{ customer.customerCode }} · {{ customer.customerName }}</option> }</select></label>
          <label class="wide">Invoice<select formControlName="invoiceId" (change)="invoiceChanged()" required><option [ngValue]="null">{{ loadingInvoices() ? 'Loading invoices...' : 'Select unpaid invoice' }}</option>@for (invoice of invoices(); track invoice.id) { <option [ngValue]="invoice.id">{{ invoice.invoiceNumber }} · {{ invoice.orderNumber }} · Due {{ invoice.outstandingAmount | currency:'INR':'symbol':'1.2-2' }}</option> }</select></label>
          @if (selectedInvoice(); as invoice) { <div class="invoice-summary wide"><span><small>CUSTOMER</small>{{ invoice.customerName }}</span><span><small>ORDER / INVOICE</small>{{ invoice.orderNumber }} / {{ invoice.invoiceNumber }}</span><span><small>INVOICE AMOUNT</small>{{ invoice.invoiceAmount | currency:'INR':'symbol':'1.2-2' }}</span><span><small>PAID</small>{{ invoice.paidAmount | currency:'INR':'symbol':'1.2-2' }}</span><span><small>OUTSTANDING</small>{{ invoice.outstandingAmount | currency:'INR':'symbol':'1.2-2' }}</span><span><small>STATUS</small>{{ invoice.paymentStatus }}</span></div> }
          <label>Amount (₹)<input type="number" formControlName="amount" min="0.01" [max]="selectedInvoice()?.outstandingAmount ?? null" step="0.01" required></label>
          <label>Payment date<input type="date" formControlName="paymentDate" required></label>
          <label>Payment method<select formControlName="paymentType"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="PHONEPE">PhonePe</option><option value="BANK_TRANSFER">Bank transfer</option><option value="OTHER">Other</option><option value="CHEQUE">Cheque (legacy)</option></select></label>
          <label>Reference number<input formControlName="referenceNumber" maxlength="80"></label>
          <label class="wide">Remarks<input formControlName="remarks" maxlength="500"></label>
        </div><p class="stock-note">Only successful receipts reduce invoice balances. The server validates current outstanding and prevents duplicate submissions.</p><footer><button class="secondary-action" type="button" (click)="formOpen.set(false)">Cancel</button><button class="primary-action" type="submit" [disabled]="saving() || !selectedInvoice()"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Record payment' }}</button></footer></form>
      </section></div> }
    </section>
  `,
  styles: [`
    :host{display:block;--line:#e6e9e5;--muted:#7b8680}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}.eyebrow{margin:0 0 8px;color:#829088;font-size:9px;font-weight:700;letter-spacing:1px}h1{margin:0;color:#20332a;font:700 26px Manrope,sans-serif}.description{margin:8px 0 0;color:var(--muted);font-size:12px}.primary-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:0 13px;border:0;border-radius:5px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{color:#fff;background:#24554b}.primary-action:disabled{opacity:.6}.primary-action mat-icon{width:17px;height:17px;font-size:17px}.secondary-action{color:#41564b;background:#fff;border:1px solid #dfe5df}.metric-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:14px}.metric-row article{display:grid;gap:8px;padding:14px;background:#fff;border:1px solid var(--line);border-radius:6px;color:#7a877f;font-size:10px}.metric-row strong{color:#273a31;font:700 20px Manrope,sans-serif}.table-panel{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:7px}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{padding:12px;color:#89948d;background:#fafbf9;border-bottom:1px solid var(--line);font-size:8px;letter-spacing:.6px}td{padding:12px;color:#58675e;border-bottom:1px solid #eef0ed;font-size:10px}td small{display:block;margin-top:4px;color:#929b95;font-size:9px}.money{color:#327557;font-weight:700}.empty{min-height:130px;display:grid;place-items:center;color:#77827b;font-size:11px}.feedback{margin:0 0 12px;padding:10px 12px;border-radius:5px;font-size:11px}.feedback.success{color:#286346;background:#edf6ef}.feedback.error{color:#9d4c38;background:#fbefeb}.customer-link{padding:0;border:0;background:transparent;color:#24554b;font:inherit;font-weight:700;text-align:left;text-decoration:underline;text-underline-offset:2px;cursor:pointer}.backdrop{position:fixed;z-index:50;inset:0;display:grid;place-items:center;padding:18px;background:#15251f66}.dialog{width:min(600px,100%);max-height:90vh;overflow:auto;padding:20px;background:#fff;border-radius:7px;box-shadow:0 20px 60px #10201833}.statement-dialog{width:min(1050px,100%)}.dialog header{display:flex;justify-content:space-between;margin-bottom:16px}.dialog h2{margin:0;color:#20332a;font:700 20px Manrope,sans-serif}.statement-customer{margin:7px 0 0;color:#364b3e;font-size:12px;font-weight:600}.statement-customer small{margin-left:7px;color:#88948b;font-size:10px;font-weight:400}.statement-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:12px}.statement-summary article{display:grid;gap:7px;padding:12px;border:1px solid var(--line);border-radius:5px;color:#7a877f;font-size:10px}.statement-summary strong{color:#273a31;font:700 17px Manrope,sans-serif}.statement-table{min-width:800px}.dialog footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 13px}.form-grid label{display:grid;gap:5px;color:#647168;font-size:10px;font-weight:600}.form-grid input,.form-grid select{width:100%;height:35px;padding:0 9px;background:#fff;border:1px solid #dfe5df;border-radius:4px;font-size:11px}.form-grid .wide{grid-column:1/-1}.invoice-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:10px;background:#f5f8f5;border-radius:4px;color:#344a3c;font-size:10px}.invoice-summary span{display:grid;gap:4px}.invoice-summary small{color:#849087;font-size:8px;letter-spacing:.5px}.stock-note{padding:10px;color:#53705e;background:#f1f6f1;border-radius:4px;font-size:10px}@media(max-width:560px){.page-heading{align-items:flex-start;flex-direction:column}.metric-row{grid-template-columns:1fr}.statement-summary{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}.invoice-summary{grid-template-columns:1fr 1fr}}
  `]
})
export class PaymentPageComponent implements OnInit {
  private readonly api = inject(LogisticsApiService);
  private readonly customerApi = inject(CustomerApiService);
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly fb = inject(FormBuilder);
  private readonly invoiceRequests = new Subject<number>();
  private readonly statementRequests = new Subject<number>();
  readonly payments = signal<Payment[]>([]);
  readonly statementPayments = signal<Payment[]>([]);
  readonly statementCustomer = signal<Payment | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly invoices = signal<Invoice[]>([]);
  readonly loading = signal(false);
  readonly loadingInvoices = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly statementOpen = signal(false);
  readonly statementLoading = signal(false);
  readonly statementError = signal('');
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  readonly totalReceived = () => this.payments()
    .filter((payment) => payment.paymentStatus === 'SUCCESSFUL')
    .reduce((sum, payment) => sum + payment.amount, 0);
  readonly statementTotalReceived = () => this.statementPayments()
    .filter((payment) => payment.paymentStatus === 'SUCCESSFUL')
    .reduce((sum, payment) => sum + payment.amount, 0);
  readonly selectedInvoice = () => this.invoices().find((invoice) => invoice.id === this.form.controls.invoiceId.value) ?? null;
  readonly form = this.fb.group({
    customerId: [null as number | null, Validators.required],
    invoiceId: [null as number | null, Validators.required],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    paymentDate: [this.today(), Validators.required],
    paymentType: ['CASH' as PaymentRequest['paymentType'], Validators.required],
    referenceNumber: [''],
    remarks: ['']
  });
  private requestFingerprint = '';
  private idempotencyKey = '';

  constructor() {
    this.invoiceRequests.pipe(
      switchMap((customerId) => this.invoiceApi.openForCustomer(customerId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.formError.set(error.error?.message ?? 'Could not load unpaid invoices.');
          this.loadingInvoices.set(false);
          return EMPTY;
        })
      )),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe((response) => {
      this.invoices.set(response.data.content);
      this.loadingInvoices.set(false);
    });
    this.statementRequests.pipe(
      switchMap((customerId) => this.api.customerPayments(customerId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.statementError.set(error.error?.message ?? 'Could not load customer payment history.');
          this.statementLoading.set(false);
          return EMPTY;
        })
      )),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe((response) => {
      this.statementPayments.set(response.data);
      this.statementLoading.set(false);
    });
  }

  ngOnInit(): void {
    this.load();
    this.customerApi.list('', 'true', 0, 100).subscribe({
      next: (response) => this.customers.set(response.data.content),
      error: () => this.error.set('Could not load active customers.')
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.payments().subscribe({ next: (response) => { this.payments.set(response.data.content); this.loading.set(false); }, error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not load payments.'); this.loading.set(false); } });
  }

  openForm(): void {
    this.formError.set('');
    this.invoices.set([]);
    this.requestFingerprint = '';
    this.idempotencyKey = '';
    this.form.reset({ customerId: null, invoiceId: null, amount: 0, paymentDate: this.today(), paymentType: 'CASH', referenceNumber: '', remarks: '' });
    this.formOpen.set(true);
  }

  openStatement(payment: Payment): void {
    this.statementCustomer.set(payment);
    this.statementPayments.set([]);
    this.statementError.set('');
    this.statementLoading.set(true);
    this.statementOpen.set(true);
    this.statementRequests.next(payment.customerId);
  }

  closeStatement(): void {
    this.statementOpen.set(false);
  }

  customerChanged(): void {
    this.form.controls.invoiceId.setValue(null);
    this.invoices.set([]);
    const customerId = this.form.controls.customerId.value;
    if (customerId === null) return;
    this.loadingInvoices.set(true);
    this.invoiceRequests.next(customerId);
  }

  invoiceChanged(): void {
    const outstanding = this.selectedInvoice()?.outstandingAmount;
    this.form.controls.amount.setValidators([
      Validators.required,
      Validators.min(0.01),
      ...(outstanding === undefined ? [] : [Validators.max(outstanding)])
    ]);
    this.form.controls.amount.updateValueAndValidity();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.formError.set('Select a customer and an unpaid invoice, then enter an amount within its outstanding balance.'); return; }
    const value = this.form.getRawValue();
    const requestFields = {
      customerId: Number(value.customerId),
      invoiceId: Number(value.invoiceId),
      amount: Number(value.amount),
      paymentType: value.paymentType!,
      paymentDate: value.paymentDate!,
      referenceNumber: value.referenceNumber ?? '',
      remarks: value.remarks ?? ''
    };
    const fingerprint = JSON.stringify(requestFields);
    if (this.requestFingerprint !== fingerprint) {
      this.requestFingerprint = fingerprint;
      this.idempotencyKey = crypto.randomUUID();
    }
    const request: PaymentRequest = { ...requestFields, idempotencyKey: this.idempotencyKey };
    this.saving.set(true);
    this.api.createPayment(request).subscribe({ next: (response) => { this.message.set(response.message); this.saving.set(false); this.formOpen.set(false); this.load(); }, error: (error: HttpErrorResponse) => { this.formError.set(error.error?.message ?? 'Could not record payment.'); this.saving.set(false); } });
  }

  private today(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
