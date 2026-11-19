import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ReportsPageComponent } from './reports-page.component';
import { ReportsApiService, OperationsReport } from './reports-api.service';
import { ApiResponse } from './customer-api.service';

describe('ReportsPageComponent', () => {
  let fixture: ComponentFixture<ReportsPageComponent>;
  let pendingResponses: Subject<ApiResponse<OperationsReport>>[];
  const report: OperationsReport = {
    fromDate: '2026-11-01',
    toDate: '2026-11-06',
    orderCount: 2,
    orderValue: 1000,
    paymentCount: 1,
    paymentTotal: 250,
    deliveryCount: 1,
    productionEntryCount: 1,
    producedQuantity: 100,
    rejectedQuantity: 2,
    productCount: 1,
    availableStock: 80,
    reservedStock: 10,
    damagedStock: 2,
    deliveredStock: 8
  };

  beforeEach(async () => {
    pendingResponses = [];
    await TestBed.configureTestingModule({
      imports: [ReportsPageComponent],
      providers: [{
        provide: ReportsApiService,
        useValue: {
          operations: () => {
            const response = new Subject<ApiResponse<OperationsReport>>();
            pendingResponses.push(response);
            return response.asObservable();
          }
        }
      }]
    }).compileComponents();
    fixture = TestBed.createComponent(ReportsPageComponent);
    fixture.detectChanges();
    pendingResponses[0].next(responseWith(report));
    fixture.detectChanges();
  });

  it('displays the backend summaries and current stock snapshot', () => {
    expect(fixture.nativeElement.textContent).toContain('Orders');
    expect(fixture.nativeElement.textContent).toContain('Payments');
    expect(fixture.nativeElement.textContent).toContain('Current inventory');
    expect(fixture.nativeElement.textContent).toContain('100 produced');
    expect(fixture.nativeElement.textContent).toContain('100 produced · 2 rejected');
  });

  it('displays only the latest report when requests finish out of order', () => {
    const component = fixture.componentInstance;
    component.load('2026-11-02', '2026-11-05');
    component.load('2026-11-03', '2026-11-06');

    pendingResponses[2].next(responseWith({ ...report, orderCount: 9 }));
    pendingResponses[1].next(responseWith({ ...report, orderCount: 3 }));
    fixture.detectChanges();

    expect(component.report()?.orderCount).toBe(9);
  });

  function responseWith(data: OperationsReport): ApiResponse<OperationsReport> {
    return {
      success: true,
      message: 'Operations report loaded.',
      timestamp: '2026-11-06T00:00:00Z',
      data
    };
  }
});
