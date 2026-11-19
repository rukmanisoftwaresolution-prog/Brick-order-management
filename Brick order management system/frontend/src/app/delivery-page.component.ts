import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LogisticsApiService, Delivery, DeliveryRequest, DeliveryStatus, Vehicle } from './logistics-api.service';
import { ProductOrderApiService, SalesOrder } from './product-order-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="ops-page">
      <header class="page-heading"><div><p class="eyebrow">OPERATIONS / DELIVERIES</p><h1>Deliveries</h1><p class="description">Create delivery challans and assign vehicles to order quantities.</p></div><button class="primary-action" type="button" (click)="openForm()"><mat-icon>add</mat-icon>Create delivery</button></header>
      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> } @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      <section class="table-panel">@if (loading()) { <p class="empty">Loading deliveries...</p> } @else if (deliveries().length === 0) { <p class="empty">No deliveries created.</p> } @else { <div class="table-scroll"><table><thead><tr><th>DELIVERY / CHALLAN</th><th>ORDER / CUSTOMER</th><th>VEHICLE / DRIVER</th><th>QUANTITY</th><th>STATUS</th></tr></thead><tbody>@for (delivery of deliveries(); track delivery.id) { <tr><td><button class="delivery-link" type="button" [attr.aria-label]="'View delivery ' + delivery.deliveryNumber" (click)="showDetails(delivery)">{{ delivery.deliveryNumber }}</button><button class="challan-link" type="button" [attr.aria-label]="'View challan ' + delivery.challanNumber" (click)="showDetails(delivery)">{{ delivery.challanNumber }}</button></td><td>{{ delivery.orderNumber }}<small>{{ delivery.customerName }}</small></td><td>{{ delivery.vehicleNumber || 'Unassigned' }}<small>{{ delivery.driverName || '' }}</small></td><td>{{ quantityTotal(delivery) | number }}</td><td><span class="status-pill">{{ delivery.status }}</span></td></tr> }</tbody></table></div> }</section>
      @if (selectedDelivery(); as delivery) {
        <div class="backdrop" (click)="closeDetails()">
          <section class="dialog details-dialog" role="dialog" aria-modal="true" aria-labelledby="delivery-details-title" (click)="$event.stopPropagation()">
            <header><div><p class="eyebrow">DELIVERY DETAILS</p><h2 id="delivery-details-title">{{ delivery.deliveryNumber }}</h2></div><button class="close" type="button" aria-label="Close delivery details" (click)="closeDetails()"><mat-icon>close</mat-icon></button></header>
            <dl class="details-grid">
              <div><dt>Order</dt><dd>{{ delivery.orderNumber }}</dd></div><div><dt>Customer</dt><dd>{{ delivery.customerName }}</dd></div>
              <div><dt>Vehicle</dt><dd>{{ delivery.vehicleNumber || 'Unassigned' }}</dd></div><div><dt>Driver</dt><dd>{{ delivery.driverName || 'Not assigned' }}</dd></div>
              <div><dt>Quantity</dt><dd>{{ quantityTotal(delivery) | number }}</dd></div><div><dt>Status</dt><dd><span class="status-pill">{{ delivery.status }}</span></dd></div>
              <div><dt>Challan number</dt><dd>{{ delivery.challanNumber }}</dd></div><div><dt>Created</dt><dd>{{ delivery.createdAt | date:'medium' }}</dd></div>
              <div class="address-detail"><dt>Delivery address</dt><dd>{{ delivery.deliveryAddress }}</dd></div>
            </dl>
            <section class="detail-items"><h3>Items</h3><ul>@for (item of delivery.items; track item.orderItemId) { <li><span>{{ item.productCode }} · {{ item.productName }}</span><strong>{{ item.quantity | number }}</strong></li> }</ul></section>
            @if (statusMessage()) { <p class="feedback success" role="status">{{ statusMessage() }}</p> }
            @if (statusError()) { <p class="feedback error" role="alert">{{ statusError() }}</p> }
            @if (availableStatuses(delivery.status).length > 0) {
              <section class="status-actions" aria-label="Delivery status actions">
                <h3>Update status</h3>
                <div class="status-action-list">@for (nextStatus of availableStatuses(delivery.status); track nextStatus) { <button class="status-action" type="button" [attr.data-status-action]="nextStatus" [disabled]="updatingStatus()" (click)="requestStatusChange(nextStatus)">{{ statusActionLabel(nextStatus) }}</button> }</div>
                @if (statusConfirmation(); as requestedStatus) {
                  <div class="status-confirmation" role="group" aria-label="Confirm delivery status">
                    <p>Confirm marking this delivery as {{ requestedStatus }}?</p>
                    <button class="primary-action" type="button" [disabled]="updatingStatus()" (click)="confirmStatusUpdate()">{{ updatingStatus() ? 'Updating...' : 'Confirm' }}</button>
                    <button class="secondary-action" type="button" [disabled]="updatingStatus()" (click)="cancelStatusConfirmation()">Cancel</button>
                  </div>
                }
              </section>
            }
            <footer><button class="secondary-action" type="button" (click)="closeDetails()">Close</button></footer>
          </section>
        </div>
      }
      @if (formOpen()) { <div class="backdrop" (click)="formOpen.set(false)"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="delivery-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">DISPATCH</p><h2 id="delivery-title">Create delivery</h2></div><button class="close" type="button" aria-label="Close" (click)="formOpen.set(false)"><mat-icon>close</mat-icon></button></header>
        @if (formError()) { <p class="feedback error" role="alert">{{ formError() }}</p> }
        <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
          <label class="wide">Order<select formControlName="orderId" required><option [ngValue]="null">Select order</option>@for (order of dispatchableOrders(); track order.id) { <option [ngValue]="order.id">{{ order.orderNumber }} · {{ order.customerName }}</option> }</select></label>
          <label class="wide">Order line<select formControlName="orderItemId" required><option [ngValue]="null">Select product line</option>@for (line of selectedOrder()?.items ?? []; track line.orderItemId) { <option [ngValue]="line.orderItemId">{{ line.productCode }} · {{ line.productName }} · ordered {{ line.quantity }}</option> }</select></label>
          <label>Quantity<input type="number" formControlName="quantity" min="1" step="1" required></label>
          <label>Vehicle<select formControlName="vehicleId"><option [ngValue]="null">Unassigned</option>@for (vehicle of vehicles(); track vehicle.id) { <option [ngValue]="vehicle.id">{{ vehicle.vehicleNumber }} · {{ vehicle.driverName }}</option> }</select></label>
          <label class="wide">Delivery address<input formControlName="deliveryAddress" maxlength="500" required></label>
          <label class="wide">Remarks<input formControlName="remarks" maxlength="1000"></label>
        </div><p class="stock-note">The API rejects quantities above the order line's remaining undelivered quantity.</p><footer><button class="secondary-action" type="button" (click)="formOpen.set(false)">Cancel</button><button class="primary-action" type="submit" [disabled]="saving() || dispatchableOrders().length === 0"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Create challan' }}</button></footer></form>
      </section></div> }
    </section>
  `,
  styles: [`
    :host{display:block;--line:#e6e9e5;--muted:#7b8680}.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}.eyebrow{margin:0 0 8px;color:#829088;font-size:9px;font-weight:700;letter-spacing:1px}h1{margin:0;color:#20332a;font:700 26px Manrope,sans-serif}.description{margin:8px 0 0;color:var(--muted);font-size:12px}.primary-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:0 13px;border:0;border-radius:5px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{color:#fff;background:#24554b}.primary-action:disabled{opacity:.6}.primary-action mat-icon{width:17px;height:17px;font-size:17px}.secondary-action{color:#41564b;background:#fff;border:1px solid #dfe5df}.table-panel{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:7px}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{padding:12px;color:#89948d;background:#fafbf9;border-bottom:1px solid var(--line);font-size:8px;letter-spacing:.6px}td{padding:12px;color:#58675e;border-bottom:1px solid #eef0ed;font-size:10px}td small{display:block;margin-top:4px;color:#929b95;font-size:9px}.delivery-link,.challan-link{display:block;padding:0;border:0;background:transparent;color:#24554b;font:inherit;text-align:left;text-decoration:underline;text-underline-offset:2px;cursor:pointer}.delivery-link{font-weight:700}.challan-link{margin-top:4px;color:#7b8680;font-size:9px}.delivery-link:focus-visible,.challan-link:focus-visible{outline:2px solid #24554b;outline-offset:2px}.status-pill{padding:4px 7px;color:#9b7240;background:#fbf3e7;border-radius:4px;font-size:9px}.empty{min-height:130px;display:grid;place-items:center;color:#77827b;font-size:11px}.feedback{margin:0 0 12px;padding:10px 12px;border-radius:5px;font-size:11px}.feedback.success{color:#286346;background:#edf6ef}.feedback.error{color:#9d4c38;background:#fbefeb}.backdrop{position:fixed;z-index:50;inset:0;display:grid;place-items:center;padding:18px;background:#15251f66}.dialog{width:min(640px,100%);max-height:90vh;overflow:auto;padding:20px;background:#fff;border-radius:7px;box-shadow:0 20px 60px #10201833}.dialog header{display:flex;justify-content:space-between;margin-bottom:16px}.dialog h2{margin:0;color:#20332a;font:700 20px Manrope,sans-serif}.close{border:0;background:transparent;color:#65756b;cursor:pointer}.details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;margin:0}.details-grid dt{margin-bottom:4px;color:#829088;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.details-grid dd{margin:0;color:#35473d;font-size:11px;overflow-wrap:anywhere}.details-grid .address-detail{grid-column:1/-1}.detail-items{margin-top:18px}.detail-items h3{margin:0 0 8px;color:#35473d;font-size:11px}.detail-items ul{margin:0;padding:0;list-style:none;border-top:1px solid var(--line)}.detail-items li{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #eef0ed;color:#58675e;font-size:10px}.dialog footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 13px}.form-grid label{display:grid;gap:5px;color:#647168;font-size:10px;font-weight:600}.form-grid input,.form-grid select{width:100%;height:35px;padding:0 9px;background:#fff;border:1px solid #dfe5df;border-radius:4px;font-size:11px}.form-grid .wide{grid-column:1/-1}.stock-note{padding:10px;color:#53705e;background:#f1f6f1;border-radius:4px;font-size:10px}@media(max-width:560px){.page-heading{align-items:flex-start;flex-direction:column}.form-grid,.details-grid{grid-template-columns:1fr}.form-grid .wide,.details-grid .address-detail{grid-column:auto}}
  `, `
    .status-actions{margin-top:18px;padding-top:14px;border-top:1px solid var(--line)}.status-actions h3{margin:0 0 9px;color:#35473d;font-size:11px}.status-action-list{display:flex;flex-wrap:wrap;gap:8px}.status-action{min-height:32px;padding:0 10px;color:#24554b;background:#eff6f0;border:1px solid #dce9de;border-radius:4px;font:600 10px 'DM Sans',sans-serif;cursor:pointer}.status-action:disabled,.status-confirmation button:disabled{opacity:.6;cursor:default}.status-confirmation{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px;padding:10px;background:#fbf7ed;border:1px solid #efe3c9;border-radius:5px}.status-confirmation p{flex-basis:100%;margin:0 0 2px;color:#695a3e;font-size:11px}.status-confirmation .primary-action,.status-confirmation .secondary-action{min-height:31px;font-size:10px}
  `]
})
export class DeliveryPageComponent implements OnInit {
  private readonly api = inject(LogisticsApiService);
  private readonly ordersApi = inject(ProductOrderApiService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly deliveries = signal<Delivery[]>([]);
  readonly orders = signal<SalesOrder[]>([]);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  readonly selectedDelivery = signal<Delivery | null>(null);
  readonly statusMessage = signal('');
  readonly statusError = signal('');
  readonly statusConfirmation = signal<DeliveryStatus | null>(null);
  readonly updatingStatus = signal(false);
  readonly dispatchableOrders = () => this.orders().filter((order) => !['DRAFT', 'CANCELLED', 'COMPLETED'].includes(order.status));
  readonly form = this.fb.group({ orderId: [null as number | null, Validators.required], orderItemId: [null as number | null, Validators.required], quantity: [1, [Validators.required, Validators.min(1)]], vehicleId: [null as number | null], deliveryAddress: ['', [Validators.required, Validators.maxLength(500)]], remarks: [''] });

  selectedOrder(): SalesOrder | undefined { return this.orders().find((order) => order.id === this.form.controls.orderId.value); }

  ngOnInit(): void {
    this.form.controls.orderId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((orderId) => {
      const order = this.orders().find((candidate) => candidate.id === orderId);
      this.form.controls.deliveryAddress.setValue(order?.deliveryAddress ?? '');
      this.form.controls.orderItemId.setValue(null);
    });
    this.load();
    forkJoin({ orders: this.ordersApi.orders(), vehicles: this.api.vehicles() }).subscribe({ next: (result) => { this.orders.set(result.orders.data.content); this.vehicles.set(result.vehicles.data); }, error: () => this.error.set('Could not load orders or vehicles.') });
  }

  load(): void {
    this.loading.set(true);
    this.api.deliveries().subscribe({ next: (response) => {
      this.deliveries.set(response.data.content);
      const selectedId = this.selectedDelivery()?.id;
      const refreshedSelection = response.data.content.find((delivery) => delivery.id === selectedId);
      if (refreshedSelection) this.selectedDelivery.set(refreshedSelection);
      this.loading.set(false);
    }, error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not load deliveries.'); this.loading.set(false); } });
  }

  openForm(): void { this.formError.set(''); this.form.reset({ orderId: null, orderItemId: null, quantity: 1, vehicleId: null, deliveryAddress: '', remarks: '' }); this.formOpen.set(true); }
  showDetails(delivery: Delivery): void {
    this.statusMessage.set('');
    this.statusError.set('');
    this.statusConfirmation.set(null);
    this.selectedDelivery.set(delivery);
  }
  closeDetails(): void {
    this.selectedDelivery.set(null);
    this.statusConfirmation.set(null);
  }
  quantityTotal(delivery: Delivery): number { return delivery.items.reduce((sum, item) => sum + item.quantity, 0); }
  availableStatuses(status: DeliveryStatus): DeliveryStatus[] {
    switch (status) {
      case 'PENDING': return ['LOADING'];
      case 'LOADING': return ['IN_TRANSIT', 'RETURNED'];
      case 'IN_TRANSIT': return ['DELIVERED', 'RETURNED'];
      case 'DELIVERED':
      case 'RETURNED': return [];
    }
  }
  statusActionLabel(status: DeliveryStatus): string { return `Mark ${status.toLowerCase().replace('_', ' ')}`; }
  requestStatusChange(status: DeliveryStatus): void {
    this.statusError.set('');
    this.statusMessage.set('');
    this.statusConfirmation.set(null);
    if (status === 'DELIVERED' || status === 'RETURNED') {
      this.statusConfirmation.set(status);
      return;
    }
    this.updateStatus(status);
  }
  confirmStatusUpdate(): void {
    const requestedStatus = this.statusConfirmation();
    if (requestedStatus) this.updateStatus(requestedStatus);
  }
  cancelStatusConfirmation(): void { this.statusConfirmation.set(null); }

  private updateStatus(status: DeliveryStatus): void {
    const delivery = this.selectedDelivery();
    if (!delivery) return;
    this.updatingStatus.set(true);
    this.api.updateDeliveryStatus(delivery.id, status).subscribe({
      next: (response) => {
        this.statusMessage.set(`Delivery ${response.data.deliveryNumber} status updated to ${response.data.status}.`);
        this.statusError.set('');
        this.statusConfirmation.set(null);
        if (this.selectedDelivery()?.id === delivery.id) this.selectedDelivery.set(response.data);
        this.updatingStatus.set(false);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.statusError.set(error.error?.message ?? 'Could not update delivery status.');
        this.updatingStatus.set(false);
      }
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.formError.set('Select an order line, quantity and delivery address.'); return; }
    const value = this.form.getRawValue();
    const request: DeliveryRequest = { orderId: Number(value.orderId), vehicleId: value.vehicleId === null ? null : Number(value.vehicleId), deliveryAddress: value.deliveryAddress!, remarks: value.remarks ?? '', items: [{ orderItemId: Number(value.orderItemId), quantity: Number(value.quantity) }] };
    this.saving.set(true);
    this.api.createDelivery(request).subscribe({ next: (response) => { this.message.set(`Delivery ${response.data.deliveryNumber} created. Challan ${response.data.challanNumber}.`); this.saving.set(false); this.formOpen.set(false); this.load(); }, error: (error: HttpErrorResponse) => { this.formError.set(error.error?.message ?? 'Could not create delivery.'); this.saving.set(false); } });
  }
}
