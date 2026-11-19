import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ApiResponse, Customer, CustomerApiService, PageResult } from './customer-api.service';
import { Invoice, InvoiceApiService } from './invoice-api.service';
import { CustomerPageComponent } from './customer-page.component';
import { PaymentReminderApiService } from './payment-reminder-api.service';

describe('CustomerPageComponent payment reminders', () => {
  let fixture: ComponentFixture<CustomerPageComponent>;
  let reminderApi: jasmine.SpyObj<PaymentReminderApiService>;
  const customer: Customer = {
    id: 4,
    customerCode: 'C-004',
    customerName: 'Brick House',
    customerType: 'BUSINESS',
    gstNumber: null,
    panNumber: null,
    address: null,
    city: null,
    state: null,
    pincode: null,
    contactPerson: null,
    mobileNumber: '9000000004',
    email: null,
    creditLimit: 0,
    outstandingAmount: 3000,
    active: true
  };
  const invoice: Invoice = {
    id: 9,
    invoiceNumber: 'INV-009',
    orderId: 10,
    orderNumber: 'BO-010',
    customerId: 4,
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

  beforeEach(async () => {
    reminderApi = jasmine.createSpyObj<PaymentReminderApiService>('PaymentReminderApiService', ['send']);
    reminderApi.send.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 503,
      error: { message: 'WHATSAPP reminders are unavailable because no configured provider is available.' }
    })));
    await TestBed.configureTestingModule({
      imports: [CustomerPageComponent],
      providers: [
        {
          provide: CustomerApiService,
          useValue: { list: () => of(responseWith([customer])) }
        },
        {
          provide: InvoiceApiService,
          useValue: { openForCustomer: () => of(responseWithInvoices([invoice])) }
        },
        { provide: PaymentReminderApiService, useValue: reminderApi }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerPageComponent);
    fixture.detectChanges();
  });

  it('shows provider-unavailable feedback and does not report a reminder sent', () => {
    const component = fixture.componentInstance;
    component.openReminder(customer);
    component.reminderForm.controls.invoiceId.setValue(9);
    component.sendReminder();
    fixture.detectChanges();

    expect(reminderApi.send).toHaveBeenCalledWith(4, 9, 'WHATSAPP');
    expect(fixture.nativeElement.textContent).toContain('no configured provider is available');
    expect(component.message()).toBe('');
  });

  function responseWith(content: Customer[]): ApiResponse<PageResult<Customer>> {
    return { success: true, message: '', timestamp: '', data: page(content) };
  }

  function responseWithInvoices(content: Invoice[]): ApiResponse<PageResult<Invoice>> {
    return { success: true, message: '', timestamp: '', data: page(content) };
  }

  function page<T>(content: T[]): PageResult<T> {
    return { content, totalElements: content.length, totalPages: content.length ? 1 : 0, number: 0, size: 20 };
  }
});
