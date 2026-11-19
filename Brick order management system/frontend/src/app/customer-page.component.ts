import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Customer, CustomerApiService, CustomerRequest, PageResult } from './customer-api.service';
import { Invoice, InvoiceApiService, PaymentReminderChannel } from './invoice-api.service';
import { PaymentReminderApiService } from './payment-reminder-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="customer-page">
      <header class="page-heading">
        <div><p class="eyebrow">OPERATIONS / CUSTOMERS</p><h1>Customers</h1><p class="description">Customer accounts, credit limits and outstanding balances.</p></div>
        <button class="primary-action" type="button" (click)="openCreate()"><mat-icon>add</mat-icon>Add customer</button>
      </header>

      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> }
      @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }

      <section class="toolbar" aria-label="Customer filters">
        <label class="search-box"><mat-icon>search</mat-icon><input type="search" [value]="searchText()" (input)="searchText.set($any($event.target).value)" (keydown.enter)="search()" placeholder="Search name, code or mobile" aria-label="Search customers"></label>
        <select class="filter" aria-label="Filter by status" [value]="activeFilter()" (change)="changeFilter($event)">
          <option value="all">All statuses</option><option value="true">Active</option><option value="false">Inactive</option>
        </select>
        <button class="secondary-action" type="button" (click)="search()"><mat-icon>search</mat-icon>Search</button>
      </section>

      <section class="table-panel" aria-label="Customer records">
        @if (loading()) { <div class="empty-state">Loading customers...</div> }
        @else if (customers().length === 0) { <div class="empty-state"><mat-icon>groups</mat-icon><strong>No customers found</strong><span>Adjust the search or add a customer to get started.</span></div> }
        @else {
          <div class="table-scroll"><table><thead><tr><th>CODE / CUSTOMER</th><th>CONTACT</th><th>LOCATION</th><th>OUTSTANDING</th><th>STATUS</th><th><span class="visually-hidden">Actions</span></th></tr></thead>
            <tbody>@for (customer of customers(); track customer.id) {
              <tr>
                <td><strong class="customer-name">{{ customer.customerName }}</strong><small class="customer-code">{{ customer.customerCode }} · {{ customer.customerType }}</small></td>
                <td>{{ customer.mobileNumber || '—' }}<small class="secondary-text">{{ customer.email || 'No email' }}</small></td>
                <td>{{ customer.city || '—' }}<small class="secondary-text">{{ customer.state || '' }}</small></td>
                <td class="money">{{ customer.outstandingAmount | currency:'INR':'symbol':'1.0-2' }}</td>
                <td><span class="status-pill" [class.inactive]="!customer.active">{{ customer.active ? 'Active' : 'Inactive' }}</span></td>
                <td class="row-actions"><button type="button" title="Send payment reminder" [attr.aria-label]="'Send payment reminder to ' + customer.customerName" [disabled]="customer.outstandingAmount <= 0" (click)="openReminder(customer)"><mat-icon>notifications_active</mat-icon></button><button type="button" title="Edit customer" [attr.aria-label]="'Edit ' + customer.customerName" (click)="openEdit(customer)"><mat-icon>edit</mat-icon></button><button type="button" title="Delete customer" [attr.aria-label]="'Delete ' + customer.customerName" (click)="deleteCustomer(customer)"><mat-icon>delete_outline</mat-icon></button></td>
              </tr>
            }</tbody>
          </table></div>
          <footer class="pagination"><span>{{ firstItem() }}–{{ lastItem() }} of {{ totalElements() }} customers</span><div><button type="button" aria-label="Previous page" [disabled]="pageNumber() === 0" (click)="changePage(-1)"><mat-icon>chevron_left</mat-icon></button><span>Page {{ pageNumber() + 1 }} of {{ totalPages() }}</span><button type="button" aria-label="Next page" [disabled]="pageNumber() + 1 >= totalPages()" (click)="changePage(1)"><mat-icon>chevron_right</mat-icon></button></div></footer>
        }
      </section>

      @if (formOpen()) {
        <div class="dialog-backdrop" (click)="closeForm()">
          <section class="customer-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-form-title" (click)="$event.stopPropagation()">
            <header><div><p class="eyebrow">CUSTOMER ACCOUNT</p><h2 id="customer-form-title">{{ editingCustomer() ? 'Edit customer' : 'Add customer' }}</h2></div><button type="button" class="close-button" aria-label="Close form" (click)="closeForm()"><mat-icon>close</mat-icon></button></header>
            @if (formError()) { <p class="feedback error" role="alert">{{ formError() }}</p> }
            <form [formGroup]="form" (ngSubmit)="saveCustomer()">
              <div class="form-grid">
                <label>Customer code<input formControlName="customerCode" maxlength="30" required></label>
                <label>Customer name<input formControlName="customerName" maxlength="160" required></label>
                <label>Customer type<select formControlName="customerType"><option value="BUSINESS">Business</option><option value="INDIVIDUAL">Individual</option></select></label>
                <label>GST number<input formControlName="gstNumber" maxlength="15"></label>
                <label>Contact person<input formControlName="contactPerson" maxlength="120"></label>
                <label>Mobile number<input formControlName="mobileNumber" maxlength="20" inputmode="tel"></label>
                <label>Email<input formControlName="email" type="email" maxlength="254"></label>
                <label>Credit limit<input formControlName="creditLimit" type="number" min="0" step="0.01"></label>
                <label>City<input formControlName="city" maxlength="100"></label>
                <label>State<input formControlName="state" maxlength="100"></label>
                <label class="wide">Address<input formControlName="address" maxlength="250"></label>
                <label>Pincode<input formControlName="pincode" maxlength="10"></label>
                <label class="check-label"><input formControlName="active" type="checkbox"> Active account</label>
              </div>
              <footer class="form-actions"><button class="secondary-action" type="button" (click)="closeForm()">Cancel</button><button class="primary-action" type="submit" [disabled]="saving()"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Save customer' }}</button></footer>
            </form>
          </section>
        </div>
      }

      @if (reminderCustomer(); as customer) {
        <div class="dialog-backdrop" (click)="closeReminder()">
          <section class="customer-dialog reminder-dialog" role="dialog" aria-modal="true" aria-labelledby="reminder-title" (click)="$event.stopPropagation()">
            <header><div><p class="eyebrow">CUSTOMER ACCOUNT</p><h2 id="reminder-title">Payment reminder</h2></div><button type="button" class="close-button" aria-label="Close reminder" (click)="closeReminder()"><mat-icon>close</mat-icon></button></header>
            <p class="description">Customer: <strong>{{ customer.customerName }}</strong></p>
            @if (reminderError()) { <p class="feedback error" role="alert">{{ reminderError() }}</p> }
            @if (reminderLoading()) { <div class="empty-state">Loading outstanding invoices...</div> }
            @else if (reminderInvoices().length === 0) { <div class="empty-state">No unpaid or partially paid invoices for this customer.</div> }
            @else {
              <form [formGroup]="reminderForm" (ngSubmit)="sendReminder()">
                <div class="form-grid">
                  <label class="wide">Invoice<select formControlName="invoiceId" (change)="reminderInvoiceChanged()" required><option [ngValue]="null">Select invoice</option>@for (invoice of reminderInvoices(); track invoice.id) { <option [ngValue]="invoice.id">{{ invoice.invoiceNumber }} · {{ invoice.orderNumber }} · Due {{ invoice.outstandingAmount | currency:'INR':'symbol':'1.2-2' }}</option> }</select></label>
                  @if (selectedReminderInvoice(); as invoice) {
                    <div class="reminder-summary wide"><span>Invoice {{ invoice.invoiceNumber }} · Order {{ invoice.orderNumber }}</span><span>Total {{ invoice.invoiceAmount | currency:'INR':'symbol':'1.2-2' }}</span><span>Paid {{ invoice.paidAmount | currency:'INR':'symbol':'1.2-2' }}</span><strong>Outstanding {{ invoice.outstandingAmount | currency:'INR':'symbol':'1.2-2' }}</strong><small>Please contact the Brickworks accounts team and quote the invoice number for payment instructions.</small></div>
                  }
                  <label class="wide">Channel<select formControlName="channel"><option value="WHATSAPP">WhatsApp</option><option value="SMS">SMS</option></select></label>
                </div>
                <footer class="form-actions"><button class="secondary-action" type="button" (click)="closeReminder()">Cancel</button><button class="primary-action" type="submit" [disabled]="sendingReminder() || reminderForm.invalid || reminderInvoices().length === 0">{{ sendingReminder() ? 'Sending...' : 'Send reminder' }}</button></footer>
              </form>
            }
          </section>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display:block; --ink:#24332c; --muted:#7b8680; --line:#e6e9e5; }
    .page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin-bottom:22px; }.eyebrow { margin:0 0 8px; color:#829088; font-size:9px; font-weight:700; letter-spacing:1px; }h1 { margin:0; color:#20332a; font:700 26px Manrope,sans-serif; }.description { margin:8px 0 0; color:var(--muted); font-size:12px; }
    .primary-action,.secondary-action { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:37px; padding:0 13px; border:0; border-radius:5px; font:600 11px 'DM Sans',sans-serif; cursor:pointer; }.primary-action { color:#fff; background:#24554b; }.primary-action:hover { background:#183c36; }.primary-action:disabled { opacity:.6; cursor:wait; }.primary-action mat-icon,.secondary-action mat-icon { width:17px; height:17px; font-size:17px; }.secondary-action { color:#41564b; background:#fff; border:1px solid #dfe5df; }
    .toolbar { display:flex; gap:9px; margin-bottom:12px; }.search-box { display:flex; align-items:center; gap:8px; flex:1; min-width:160px; max-width:440px; height:37px; padding:0 10px; background:#fff; border:1px solid #e1e6e1; border-radius:5px; color:#829088; }.search-box mat-icon { width:17px; height:17px; font-size:17px; }.search-box input { width:100%; min-width:0; border:0; outline:0; color:var(--ink); font-size:11px; }.filter { min-width:132px; padding:0 9px; color:#56655c; background:#fff; border:1px solid #e1e6e1; border-radius:5px; font-size:11px; }
    .table-panel { overflow:hidden; background:#fff; border:1px solid var(--line); border-radius:7px; }.table-scroll { overflow-x:auto; }table { width:100%; border-collapse:collapse; text-align:left; white-space:nowrap; }th { padding:12px 14px; color:#89948d; background:#fafbf9; border-bottom:1px solid var(--line); font-size:8px; font-weight:700; letter-spacing:.6px; }td { padding:12px 14px; color:#58675e; border-bottom:1px solid #eef0ed; font-size:10px; }tbody tr:last-child td { border-bottom:0; }.customer-name,.customer-code,.secondary-text { display:block; }.customer-name { color:#2b3d34; font-size:11px; }.customer-code,.secondary-text { margin-top:4px; color:#929b95; font-size:9px; }.money { color:#2d5042; font-weight:600; }.status-pill { padding:4px 7px; color:#397857; background:#edf5ef; border-radius:4px; font-size:9px; }.status-pill.inactive { color:#77827b; background:#eff1ef; }.row-actions { text-align:right; }.row-actions button,.pagination button,.close-button { display:inline-grid; place-items:center; width:30px; height:30px; padding:0; color:#6f7e75; background:transparent; border:0; border-radius:4px; cursor:pointer; }.row-actions button:hover,.pagination button:not(:disabled):hover,.close-button:hover { background:#f0f3f0; }.row-actions mat-icon,.pagination mat-icon,.close-button mat-icon { width:17px; height:17px; font-size:17px; }
    .pagination { display:flex; align-items:center; justify-content:space-between; padding:9px 13px; border-top:1px solid var(--line); color:#78847d; font-size:10px; }.pagination > div { display:flex; align-items:center; gap:9px; }.pagination button:disabled { opacity:.35; cursor:default; }.row-actions button:disabled{opacity:.35;cursor:default}.reminder-summary{display:grid;gap:6px;padding:12px;background:#f2f6f2;border-radius:5px;color:#41564b;font-size:10px}.reminder-summary strong{color:#24554b}.reminder-summary small{color:#77827b;line-height:1.5}
    .empty-state { min-height:200px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#89948d; font-size:11px; }.empty-state mat-icon { color:#95a79c; }.empty-state strong { color:#43534a; font-size:12px; }
    .feedback { margin:0 0 12px; padding:10px 12px; border-radius:5px; font-size:11px; }.feedback.success { color:#286346; background:#edf6ef; }.feedback.error { color:#9d4c38; background:#fbefeb; }
    .dialog-backdrop { position:fixed; z-index:50; inset:0; display:grid; place-items:center; padding:18px; background:#15251f66; }.customer-dialog { width:min(660px,100%); max-height:min(90vh,820px); overflow:auto; padding:20px; background:#fff; border-radius:7px; box-shadow:0 20px 60px #10201833; }.customer-dialog > header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; }.customer-dialog h2 { margin:0; color:#20332a; font:700 20px Manrope,sans-serif; }.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px 13px; }.form-grid label { display:grid; gap:5px; color:#647168; font-size:10px; font-weight:600; }.form-grid input:not([type=checkbox]),.form-grid select { width:100%; height:35px; padding:0 9px; border:1px solid #dfe5df; border-radius:4px; color:#27372e; background:#fff; font-size:11px; }.form-grid .wide { grid-column:1/-1; }.form-grid .check-label { display:flex; align-items:center; gap:8px; padding-top:19px; }.form-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:19px; }.visually-hidden { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
    @media (max-width:620px) { .page-heading { align-items:flex-start; flex-direction:column; }.toolbar { flex-wrap:wrap; }.search-box { max-width:none; flex-basis:100%; }.filter { flex:1; }.form-grid { grid-template-columns:1fr; }.form-grid .wide { grid-column:auto; }.customer-dialog { padding:16px; } }
  `]
})
export class CustomerPageComponent implements OnInit {
  private readonly api = inject(CustomerApiService);
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly reminderApi = inject(PaymentReminderApiService);
  private readonly formBuilder = inject(FormBuilder);
  readonly customers = signal<Customer[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  readonly searchText = signal('');
  readonly activeFilter = signal('all');
  readonly pageNumber = signal(0);
  readonly totalElements = signal(0);
  readonly totalPages = signal(1);
  readonly formOpen = signal(false);
  readonly editingCustomer = signal<Customer | null>(null);
  readonly reminderCustomer = signal<Customer | null>(null);
  readonly reminderInvoices = signal<Invoice[]>([]);
  readonly reminderLoading = signal(false);
  readonly sendingReminder = signal(false);
  readonly reminderError = signal('');
  readonly form = this.formBuilder.group({
    customerCode: ['', [Validators.required, Validators.maxLength(30)]],
    customerName: ['', [Validators.required, Validators.maxLength(160)]],
    customerType: ['BUSINESS', Validators.required],
    gstNumber: ['', Validators.maxLength(15)],
    panNumber: ['', Validators.maxLength(10)],
    address: ['', Validators.maxLength(250)],
    city: ['', Validators.maxLength(100)],
    state: ['', Validators.maxLength(100)],
    pincode: ['', Validators.maxLength(10)],
    contactPerson: ['', Validators.maxLength(120)],
    mobileNumber: ['', Validators.maxLength(20)],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    creditLimit: [0, [Validators.required, Validators.min(0)]],
    active: [true, Validators.required]
  });
  readonly reminderForm = this.formBuilder.group({
    invoiceId: [null as number | null, Validators.required],
    channel: ['WHATSAPP' as PaymentReminderChannel, Validators.required]
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.searchText(), this.activeFilter(), this.pageNumber(), 20).subscribe({
      next: (response) => {
        const result: PageResult<Customer> = response.data;
        this.customers.set(result.content);
        this.totalElements.set(result.totalElements);
        this.totalPages.set(Math.max(result.totalPages, 1));
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.errorMessage(error));
        this.loading.set(false);
      }
    });
  }

  search(): void {
    this.pageNumber.set(0);
    this.loadCustomers();
  }

  changeFilter(event: Event): void {
    this.activeFilter.set((event.target as HTMLSelectElement).value);
    this.search();
  }

  changePage(delta: number): void {
    this.pageNumber.update((page) => page + delta);
    this.loadCustomers();
  }

  openCreate(): void {
    this.editingCustomer.set(null);
    this.formError.set('');
    this.form.reset({ customerCode: '', customerName: '', customerType: 'BUSINESS', creditLimit: 0, active: true });
    this.formOpen.set(true);
  }

  openEdit(customer: Customer): void {
    this.editingCustomer.set(customer);
    this.formError.set('');
    this.form.reset({ ...customer, creditLimit: customer.creditLimit });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveCustomer(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Enter a customer code, customer name, valid email and non-negative credit limit.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.message.set('');
    const request = this.form.getRawValue() as CustomerRequest;
    const current = this.editingCustomer();
    const save = current ? this.api.update(current.id, request) : this.api.create(request);
    save.subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.saving.set(false);
        this.formOpen.set(false);
        this.loadCustomers();
      },
      error: (error: HttpErrorResponse) => {
        this.formError.set(this.errorMessage(error));
        this.saving.set(false);
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    if (!window.confirm(`Delete ${customer.customerName}? This cannot be undone.`)) return;
    this.api.delete(customer.id).subscribe({
      next: (response) => {
        this.message.set(response.message);
        this.loadCustomers();
      },
      error: (error: HttpErrorResponse) => this.error.set(this.errorMessage(error))
    });
  }

  openReminder(customer: Customer): void {
    this.reminderCustomer.set(customer);
    this.reminderError.set('');
    this.reminderInvoices.set([]);
    this.reminderForm.reset({ invoiceId: null, channel: 'WHATSAPP' });
    this.reminderLoading.set(true);
    this.invoiceApi.openForCustomer(customer.id).subscribe({
      next: (response) => {
        this.reminderInvoices.set(response.data.content);
        this.reminderLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.reminderError.set(error.error?.message ?? 'Could not load outstanding invoices.');
        this.reminderLoading.set(false);
      }
    });
  }

  closeReminder(): void {
    this.reminderCustomer.set(null);
  }

  selectedReminderInvoice(): Invoice | null {
    const invoiceId = this.reminderForm.controls.invoiceId.value;
    return this.reminderInvoices().find((invoice) => invoice.id === invoiceId) ?? null;
  }

  reminderInvoiceChanged(): void {
    this.reminderError.set('');
  }

  sendReminder(): void {
    const customer = this.reminderCustomer();
    const value = this.reminderForm.getRawValue();
    if (!customer || this.reminderForm.invalid || value.invoiceId === null || this.sendingReminder()) return;
    this.sendingReminder.set(true);
    this.reminderError.set('');
    this.reminderApi.send(customer.id, value.invoiceId, value.channel!)
      .subscribe({
        next: (response) => {
          this.message.set(response.message);
          this.sendingReminder.set(false);
          this.closeReminder();
        },
        error: (error: HttpErrorResponse) => {
          this.reminderError.set(error.error?.message ?? 'Reminder provider is unavailable.');
          this.sendingReminder.set(false);
        }
      });
  }

  firstItem(): number {
    return this.totalElements() === 0 ? 0 : this.pageNumber() * 20 + 1;
  }

  lastItem(): number {
    return Math.min((this.pageNumber() + 1) * 20, this.totalElements());
  }

  private errorMessage(error: HttpErrorResponse): string {
    return error.error?.message ?? error.message ?? 'The request could not be completed.';
  }
}
