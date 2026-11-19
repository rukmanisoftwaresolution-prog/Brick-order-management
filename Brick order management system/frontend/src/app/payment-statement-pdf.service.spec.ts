import { Customer } from './customer-api.service';
import { Payment } from './logistics-api.service';
import { formatStatementTimestamp, PaymentStatementPdfService } from './payment-statement-pdf.service';

describe('PaymentStatementPdfService', () => {
  const selectedCustomer: Payment = {
    id: 21,
    customerId: 5,
    customerCode: 'C-005',
    customerName: 'Brick House',
    orderNumber: 'BO-008',
    paymentDate: '2026-11-14',
    createdAt: '2026-11-15T00:30:00Z',
    amount: 1250,
    paymentType: 'BANK_TRANSFER',
    referenceNumber: 'REF-21',
    remarks: null,
    invoiceNumber: 'INV-007',
    paymentStatus: 'SUCCESSFUL'
  };
  const customerDetails: Customer = {
    id: 5,
    customerCode: 'C-005',
    customerName: 'Brick House',
    customerType: 'BUSINESS',
    gstNumber: null,
    panNumber: null,
    address: '12 Market Road',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700001',
    contactPerson: 'Rita',
    mobileNumber: '9000000005',
    email: 'accounts@example.com',
    creditLimit: 0,
    outstandingAmount: 0,
    active: true
  };

  let service: PaymentStatementPdfService;

  beforeEach(() => {
    service = new PaymentStatementPdfService();
  });

  it('includes only the selected customer, keeps payment order, and summarizes successful payments in INR', () => {
    const secondPayment: Payment = {
      ...selectedCustomer,
      id: 22,
      createdAt: '2026-11-13T03:30:00Z',
      amount: 500.5,
      paymentStatus: 'PENDING',
      invoiceNumber: null
    };
    const otherCustomerPayment = { ...selectedCustomer, customerId: 9, customerName: 'Other Customer' };
    const document = service.buildDocument(
      selectedCustomer,
      [selectedCustomer, secondPayment, otherCustomerPayment],
      customerDetails,
      new Date('2026-11-19T07:28:00Z')
    );
    const content = JSON.stringify(document);

    expect(content).toContain('Total transactions: 2');
    expect(content).toContain('Successful payments received: INR (₹) 1,250.00');
    expect(content).toContain('₹ 1,250.00');
    expect(content).toContain('₹ 500.50');
    expect(content).toContain('14 Nov 2026');
    expect(content).toContain('15 Nov 2026, 06:00:00 AM IST');
    expect(content).toContain('13 Nov 2026, 09:00:00 AM IST');
    expect(content).toContain('Payment Date');
    expect(content).toContain('Recorded At (IST)');
    expect(content).toContain('12 Market Road, Kolkata, West Bengal, 700001');
    expect(content).not.toContain('Other Customer');
    expect(content.indexOf('REF-21')).toBeLessThan(content.indexOf('Advance payment'));
    expect(content).toContain('"headerRows":1');
    expect(typeof document.footer).toBe('function');
    expect(content).toContain('"alignment":"right"');
  });

  it('removes duplicate address fragments without changing the supplied location data', () => {
    const duplicateAddress = {
      ...customerDetails,
      address: '12 Market Road, Kolkata, West Bengal',
      city: 'Kolkata',
      state: 'West Bengal'
    };
    const document = service.buildDocument(selectedCustomer, [selectedCustomer], duplicateAddress);
    const content = JSON.stringify(document);

    expect(content).toContain('12 Market Road, Kolkata, West Bengal, 700001');
    expect(content).not.toContain('Kolkata, West Bengal, Kolkata');
  });

  it('renders empty statements with a zero total and a clear empty-state message', () => {
    const document = service.buildDocument(
      selectedCustomer,
      [],
      undefined,
      new Date('2026-11-19T07:28:00Z')
    );
    const content = JSON.stringify(document);

    expect(content).toContain('Total transactions: 0');
    expect(content).toContain('Successful payments received: INR (₹) 0.00');
    expect(content).toContain('No payment history is available for this customer.');
  });

  it('generates a PDF blob and downloads it with a customer-specific filename', async () => {
    const createObjectUrl = spyOn(URL, 'createObjectURL').and.returnValue('blob:payment-statement');
    let downloadedFileName = '';
    const anchorClick = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      downloadedFileName = this.download;
    });

    await service.download(selectedCustomer, [selectedCustomer], customerDetails);

    expect(createObjectUrl).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
    expect(downloadedFileName).toBe('Payment_Statement_Brick_House.pdf');
  });

  it('formats generation timestamps in Asia/Kolkata', () => {
    expect(formatStatementTimestamp(new Date('2026-11-19T07:28:00Z')))
      .toBe('19 Nov 2026, 12:58:00 PM');
  });
});
