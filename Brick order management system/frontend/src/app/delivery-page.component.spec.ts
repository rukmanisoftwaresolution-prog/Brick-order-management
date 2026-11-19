import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ApiResponse, PageResult } from './customer-api.service';
import { Delivery, DeliveryStatus, LogisticsApiService } from './logistics-api.service';
import { DeliveryPageComponent } from './delivery-page.component';
import { ProductOrderApiService, SalesOrder } from './product-order-api.service';

describe('DeliveryPageComponent', () => {
  let fixture: ComponentFixture<DeliveryPageComponent>;
  let logisticsApi: jasmine.SpyObj<LogisticsApiService>;
  const firstOrder = createOrder(10, 'BO-010', 'First address');
  const secondOrder = createOrder(11, 'BO-011', 'Updated address');
  const delivery: Delivery = {
    id: 21,
    deliveryNumber: 'DL-021',
    orderNumber: 'BO-010',
    customerName: 'Brick House',
    vehicleNumber: 'TRUCK-21',
    driverName: 'Ravi Kumar',
    status: 'PENDING',
    deliveryAddress: 'First address',
    challanNumber: 'CH-021',
    createdAt: '2026-11-16T10:00:00Z',
    items: [
      { orderItemId: 31, productCode: 'BR-001', productName: 'Red Brick', quantity: 18 },
      { orderItemId: 32, productCode: 'BR-002', productName: 'Clay Brick', quantity: 22 }
    ]
  };

  beforeEach(async () => {
    logisticsApi = jasmine.createSpyObj<LogisticsApiService>(
      'LogisticsApiService',
      ['deliveries', 'vehicles', 'createDelivery', 'updateDeliveryStatus']
    );
    logisticsApi.deliveries.and.returnValue(of(responseWithPage([delivery])));
    logisticsApi.updateDeliveryStatus.and.returnValue(of(responseWithDelivery(delivery)));
    logisticsApi.vehicles.and.returnValue(of({
      success: true, message: 'Vehicles loaded.', timestamp: '', data: []
    }));

    const ordersApi = jasmine.createSpyObj<ProductOrderApiService>('ProductOrderApiService', ['orders']);
    ordersApi.orders.and.returnValue(of(responseWithPage([firstOrder, secondOrder])));

    await TestBed.configureTestingModule({
      imports: [DeliveryPageComponent],
      providers: [
        { provide: LogisticsApiService, useValue: logisticsApi },
        { provide: ProductOrderApiService, useValue: ordersApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DeliveryPageComponent);
    fixture.detectChanges();
  });

  it('fills the editable delivery address from the selected order', () => {
    const component = fixture.componentInstance;
    component.openForm();
    component.form.controls.orderId.setValue(firstOrder.id);
    fixture.detectChanges();

    const addressInput = fixture.nativeElement.querySelector(
      'input[formControlName="deliveryAddress"]'
    ) as HTMLInputElement;
    expect(addressInput.value).toBe(firstOrder.deliveryAddress);
    expect(addressInput.readOnly).toBeFalse();

    addressInput.value = 'Administrator override';
    addressInput.dispatchEvent(new Event('input'));
    expect(component.form.controls.deliveryAddress.value).toBe('Administrator override');
  });

  it('replaces the address when a different order is selected', () => {
    const component = fixture.componentInstance;
    component.openForm();
    component.form.controls.orderId.setValue(firstOrder.id);
    component.form.controls.orderItemId.setValue(31);
    component.form.controls.orderId.setValue(secondOrder.id);

    expect(component.form.controls.deliveryAddress.value).toBe(secondOrder.deliveryAddress);
    expect(component.form.controls.orderItemId.value).toBeNull();
  });

  it('opens delivery details from either the delivery or challan number', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button.delivery-link, button.challan-link');
    expect(buttons.length).toBe(2);

    (buttons[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('BO-010');
    expect(dialog.textContent).toContain('Brick House');
    expect(dialog.textContent).toContain('First address');
    expect(dialog.textContent).toContain('TRUCK-21');
    expect(dialog.textContent).toContain('Ravi Kumar');
    expect(dialog.textContent).toContain('40');
    expect(dialog.textContent).toContain('CH-021');
    expect(dialog.textContent).toContain('PENDING');
    expect(dialog.textContent).toContain('Red Brick');
    expect(dialog.textContent).toContain('Clay Brick');

    fixture.nativeElement.querySelector('button[aria-label="Close delivery details"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows only the valid next status actions', () => {
    const component = fixture.componentInstance;
    const cases: { status: DeliveryStatus; actions: string[] }[] = [
      { status: 'PENDING', actions: ['LOADING'] },
      { status: 'LOADING', actions: ['IN_TRANSIT', 'RETURNED'] },
      { status: 'IN_TRANSIT', actions: ['DELIVERED', 'RETURNED'] },
      { status: 'DELIVERED', actions: [] },
      { status: 'RETURNED', actions: [] }
    ];

    for (const testCase of cases) {
      component.showDetails({ ...delivery, status: testCase.status });
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button.status-action') as NodeListOf<HTMLButtonElement>;
      const actions = Array.from(buttons).map((button) => button.getAttribute('data-status-action'));
      expect(actions).toEqual(testCase.actions);
    }
  });

  it('requires confirmation before delivered or returned status updates', () => {
    const component = fixture.componentInstance;
    component.showDetails({ ...delivery, status: 'IN_TRANSIT' });
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[data-status-action="DELIVERED"]').click();
    fixture.detectChanges();
    expect(component.statusConfirmation()).toBe('DELIVERED');
    expect(logisticsApi.updateDeliveryStatus).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Confirm marking this delivery as DELIVERED?');
    fixture.nativeElement.querySelector('.status-confirmation .primary-action').click();
    fixture.detectChanges();
    expect(logisticsApi.updateDeliveryStatus).toHaveBeenCalledWith(delivery.id, 'DELIVERED');

    component.showDetails({ ...delivery, status: 'LOADING' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[data-status-action="RETURNED"]').click();
    fixture.detectChanges();
    expect(component.statusConfirmation()).toBe('RETURNED');
    expect(logisticsApi.updateDeliveryStatus).toHaveBeenCalledTimes(1);
  });

  it('updates status, then refreshes the list and selected delivery', () => {
    const component = fixture.componentInstance;
    const updatedDelivery = { ...delivery, status: 'LOADING' as const };
    logisticsApi.updateDeliveryStatus.and.returnValue(of(responseWithDelivery(updatedDelivery)));
    logisticsApi.deliveries.and.returnValue(of(responseWithPage([updatedDelivery])));
    component.showDetails(delivery);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[data-status-action="LOADING"]').click();
    fixture.detectChanges();

    expect(logisticsApi.updateDeliveryStatus).toHaveBeenCalledWith(delivery.id, 'LOADING');
    expect(component.deliveries()[0].status).toBe('LOADING');
    expect(component.selectedDelivery()?.status).toBe('LOADING');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('status updated to LOADING');
  });

  it('shows API errors when a status update fails', () => {
    const component = fixture.componentInstance;
    logisticsApi.updateDeliveryStatus.and.returnValue(throwError(() => new HttpErrorResponse({
      status: 409,
      error: { message: 'Delivery status cannot change from PENDING to IN_TRANSIT.' }
    })));
    component.showDetails(delivery);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[data-status-action="LOADING"]').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('Delivery status cannot change from PENDING to IN_TRANSIT.');
    expect(component.selectedDelivery()?.status).toBe('PENDING');
  });

  function createOrder(id: number, orderNumber: string, deliveryAddress: string): SalesOrder {
    return {
      id,
      orderNumber,
      customerId: 7,
      customerName: 'Brick House',
      orderDate: '2026-11-16',
      requiredDeliveryDate: null,
      deliveryAddress,
      transportationMode: 'CUSTOMER_PICKUP',
      status: 'CONFIRMED',
      subtotal: 100,
      discountTotal: 0,
      taxTotal: 18,
      totalAmount: 118,
      items: [{
        orderItemId: id + 20,
        productId: 5,
        productCode: 'BR-001',
        productName: 'Red Brick',
        quantity: 50,
        rate: 2,
        discount: 0,
        gstPercentage: 18,
        amount: 118
      }]
    };
  }

  function responseWithPage<T>(content: T[]): ApiResponse<PageResult<T>> {
    return {
      success: true,
      message: 'Loaded.',
      timestamp: '',
      data: {
        content,
        totalElements: content.length,
        totalPages: content.length ? 1 : 0,
        number: 0,
        size: 50
      }
    };
  }

  function responseWithDelivery(data: Delivery): ApiResponse<Delivery> {
    return { success: true, message: 'Delivery updated.', timestamp: '', data };
  }
});
