import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { InvoicePageComponent } from './invoice-page.component';
import { Invoice, InvoiceApiService } from './invoice-api.service';
import { ApiResponse, PageResult } from './customer-api.service';

describe('InvoicePageComponent', () => {
  let fixture: ComponentFixture<InvoicePageComponent>;
  let pendingResponses: Subject<ApiResponse<PageResult<Invoice>>>[];
  const invoice: Invoice = {
    id: 1,
    invoiceNumber: 'INV-001',
    orderNumber: 'BO-001',
    customerName: 'Brick House',
    invoiceDate: '2026-11-06',
    taxableAmount: 100,
    cgst: 9,
    sgst: 9,
    igst: 0,
    invoiceAmount: 118
  };

  beforeEach(async () => {
    pendingResponses = [];
    await TestBed.configureTestingModule({
      imports: [InvoicePageComponent],
      providers: [{
        provide: InvoiceApiService,
        useValue: {
          list: () => {
            const response = new Subject<ApiResponse<PageResult<Invoice>>>();
            pendingResponses.push(response);
            return response.asObservable();
          }
        }
      }]
    }).compileComponents();
    fixture = TestBed.createComponent(InvoicePageComponent);
    fixture.detectChanges();
    pendingResponses[0].next(responseWith([invoice]));
    fixture.detectChanges();
  });

  it('loads and displays invoices from the listing API', () => {
    expect(fixture.nativeElement.textContent).toContain('INV-001');
    expect(fixture.nativeElement.textContent).toContain('Brick House');
  });

  it('displays only the latest result when overlapping searches finish out of order', () => {
    const component = fixture.componentInstance;
    component.load('older search', 0);
    component.load('latest search', 0);

    pendingResponses[2].next(responseWith([{
      ...invoice,
      id: 3,
      invoiceNumber: 'INV-LATEST'
    }]));
    pendingResponses[1].next(responseWith([{
      ...invoice,
      id: 2,
      invoiceNumber: 'INV-OLDER'
    }]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('INV-LATEST');
    expect(fixture.nativeElement.textContent).not.toContain('INV-OLDER');
    expect(component.query()).toBe('latest search');
  });

  function responseWith(content: Invoice[]): ApiResponse<PageResult<Invoice>> {
    return {
      success: true,
      message: 'Invoices loaded.',
      timestamp: '2026-11-06T00:00:00Z',
      data: { content, totalElements: content.length, totalPages: content.length ? 1 : 0, number: 0, size: 20 }
    };
  }
});
