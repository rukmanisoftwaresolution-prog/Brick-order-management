import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiResponse, Customer, PageResult } from './customer-api.service';
import { Invoice, InvoiceApiService } from './invoice-api.service';
import { LogisticsApiService, Payment, PaymentRequest } from './logistics-api.service';
import { PaymentPageComponent } from './payment-page.component';
import { CustomerApiService } from './customer-api.service';

describe('PaymentPageComponent', () => {
  let fixture: ComponentFixture<PaymentPageComponent>;
  let invoiceApi: jasmine.SpyObj<InvoiceApiService>;
  let logisticsApi: jasmine.SpyObj<LogisticsApiService>;

  const customer: Customer = {
    id: 5,
    customerCode: 'C-005',
    customerName: 'Brick House',
    customerType: 'BUSINESS',
    gstNumber: null,
    panNumber: null,
    address: null,
    city: null,
    state: null,
    pincode: null,
    contactPerson: null,
    mobileNumber: '9000000005',
    email: null,
    creditLimit: 0,
    outstandingAmount: 3000,
    active: true
  };
  const invoice: Invoice = {
    id: 7,
    invoiceNumber: 'INV-007',
    orderId: 8,
    orderNumber: 'BO-008',
    customerId: 5,
    customerName: 'Brick House',
    invoiceDate: '2026-11-14',
    taxableAmount: 5000,
    cgst: 0,
    sgst: 0,
    igst: 0,
    invoiceAmount: 5000,
    paidAmount: 2000,
    outstandingAmount: 3000,
    paymentStatus: 'PARTIALLY_PAID'
  };
  const payment: Payment = {
    id: 12,
    customerId: 5,
    customerCode: 'C-005',
    customerName: 'Brick House',
    orderNumber: 'BO-008',
    paymentDate: '2026-11-14',
    createdAt: '2026-11-14T10:30:00Z',
    amount: 1000,
    paymentType: 'CASH',
    referenceNumber: 'CASH-12',
    remarks: null,
    invoiceNumber: 'INV-007',
    paymentStatus: 'SUCCESSFUL'
  };

  beforeEach(async () => {
    invoiceApi = jasmine.createSpyObj<InvoiceApiService>('InvoiceApiService', ['openForCustomer']);
    logisticsApi = jasmine.createSpyObj<LogisticsApiService>('LogisticsApiService', ['payments', 'customerPayments', 'createPayment']);
    invoiceApi.openForCustomer.and.returnValue(of(responseWith([invoice])));
    logisticsApi.payments.and.returnValue(of(responseWithPayments([payment])));
    logisticsApi.customerPayments.and.returnValue(of(responseWithHistory([])));
    logisticsApi.createPayment.and.returnValue(of({
      success: true,
      message: 'Payment recorded.',
      timestamp: '',
      data: {} as Payment
    }));

    await TestBed.configureTestingModule({
      imports: [PaymentPageComponent],
      providers: [
        { provide: CustomerApiService, useValue: { list: () => of(responseWithCustomers([customer])) } },
        { provide: InvoiceApiService, useValue: invoiceApi },
        { provide: LogisticsApiService, useValue: logisticsApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentPageComponent);
    fixture.detectChanges();
  });

  it('loads invoices for the selected customer and displays server balance values', () => {
    fixture.componentInstance.openForm();
    fixture.componentInstance.form.controls.customerId.setValue(5);
    fixture.componentInstance.customerChanged();
    fixture.componentInstance.form.controls.invoiceId.setValue(7);
    fixture.componentInstance.invoiceChanged();
    fixture.detectChanges();

    expect(invoiceApi.openForCustomer).toHaveBeenCalledWith(5);
    expect(fixture.nativeElement.textContent).toContain('INV-007');
    expect(fixture.nativeElement.textContent).toContain('3,000.00');
    expect(fixture.nativeElement.textContent).toContain('PARTIALLY_PAID');
  });

  it('submits the selected invoice and keeps a stable idempotency key for the request', () => {
    const component = fixture.componentInstance;
    component.openForm();
    component.form.controls.customerId.setValue(5);
    component.customerChanged();
    component.form.controls.invoiceId.setValue(7);
    component.invoiceChanged();
    component.form.controls.amount.setValue(1000);
    component.form.controls.paymentDate.setValue('2026-11-14');
    component.form.controls.paymentType.setValue('PHONEPE');

    component.save();

    const request = logisticsApi.createPayment.calls.mostRecent().args[0] as PaymentRequest;
    expect(request.customerId).toBe(5);
    expect(request.invoiceId).toBe(7);
    expect(request.amount).toBe(1000);
    expect(request.paymentType).toBe('PHONEPE');
    expect(request.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('opens the selected customer statement and displays every returned transaction with its timestamp', () => {
    const secondPayment: Payment = {
      ...payment,
      id: 13,
      createdAt: '2026-11-13T03:30:00Z',
      amount: 700,
      paymentType: 'CHEQUE',
      referenceNumber: 'CHQ-13',
      invoiceNumber: null,
      paymentStatus: 'SUCCESSFUL'
    };
    logisticsApi.customerPayments.and.returnValue(of(responseWithHistory([payment, secondPayment])));

    fixture.nativeElement.querySelector('.customer-link').click();
    fixture.detectChanges();

    expect(logisticsApi.customerPayments).toHaveBeenCalledWith(5);
    expect(fixture.nativeElement.textContent).toContain('Payment Statement');
    expect(fixture.nativeElement.textContent).toContain('Brick House');
    expect(fixture.nativeElement.textContent).toContain('C-005');
    expect(fixture.nativeElement.textContent).toContain('INV-007');
    expect(fixture.nativeElement.textContent).toContain('Advance payment');
    expect(fixture.nativeElement.textContent).toContain('CASH-12');
    expect(fixture.nativeElement.textContent).toContain('CHQ-13');
    expect(fixture.nativeElement.textContent).toContain('CHEQUE');
    expect(fixture.nativeElement.textContent).toContain('04:00:00 PM');
    expect(fixture.nativeElement.textContent).toContain('09:00:00 AM');
    expect(fixture.componentInstance.statementTotalReceived()).toBe(1700);
    expect(fixture.nativeElement.textContent).toContain('Close');
  });

  it('shows an empty state and reloads customer history when opened again', () => {
    fixture.nativeElement.querySelector('.customer-link').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No payment history for this customer.');
    expect(logisticsApi.customerPayments).toHaveBeenCalledWith(5);

    fixture.componentInstance.closeStatement();
    fixture.nativeElement.querySelector('.customer-link').click();

    expect(logisticsApi.customerPayments).toHaveBeenCalledTimes(2);
  });

  it('counts only successful payments in total received', () => {
    fixture.componentInstance.payments.set([
      payment,
      { ...payment, id: 13, amount: 300, paymentStatus: 'PENDING' },
      { ...payment, id: 14, amount: 200, paymentStatus: 'FAILED' },
      { ...payment, id: 15, amount: 100, paymentStatus: 'REVERSED' }
    ]);

    expect(fixture.componentInstance.totalReceived()).toBe(1000);
  });

  function responseWith(content: Invoice[]): ApiResponse<PageResult<Invoice>> {
    return { success: true, message: '', timestamp: '', data: page(content) };
  }

  function responseWithPayments(content: Payment[]): ApiResponse<PageResult<Payment>> {
    return { success: true, message: '', timestamp: '', data: page(content) };
  }

  function responseWithHistory(content: Payment[]): ApiResponse<Payment[]> {
    return { success: true, message: '', timestamp: '', data: content };
  }

  function responseWithCustomers(content: Customer[]): ApiResponse<PageResult<Customer>> {
    return { success: true, message: '', timestamp: '', data: page(content) };
  }

  function page<T>(content: T[]): PageResult<T> {
    return { content, totalElements: content.length, totalPages: content.length ? 1 : 0, number: 0, size: 20 };
  }
});
