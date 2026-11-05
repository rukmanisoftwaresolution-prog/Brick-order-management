import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Product } from './product-order-api.service';
import { ProductOrderApiService } from './product-order-api.service';
import { OperationsApiService, ProductionEntry, ProductionRequest } from './operations-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="ops-page">
      <header class="page-heading"><div><p class="eyebrow">OPERATIONS / PRODUCTION</p><h1>Production</h1><p class="description">Daily output, rejected units and raw material consumption.</p></div><button class="primary-action" type="button" (click)="formOpen.set(true)"><mat-icon>add</mat-icon>Record production</button></header>
      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> }
      @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      <div class="metric-row"><article><span>Entries shown</span><strong>{{ entries().length }}</strong></article><article><span>Accepted units</span><strong>{{ acceptedTotal() | number }}</strong></article><article><span>Rejected units</span><strong>{{ rejectedTotal() | number }}</strong></article></div>
      <section class="table-panel">@if (loading()) { <p class="empty">Loading production entries...</p> } @else if (entries().length === 0) { <p class="empty">No production entries recorded.</p> } @else { <div class="table-scroll"><table><thead><tr><th>DATE</th><th>PRODUCT</th><th>TARGET</th><th>ACTUAL</th><th>REJECTED</th><th>ACCEPTED / STOCK</th><th>KILN / MACHINE</th></tr></thead><tbody>@for (entry of entries(); track entry.id) { <tr><td>{{ entry.productionDate | date:'dd MMM yyyy' }}</td><td><strong>{{ entry.productName }}</strong><small>{{ entry.productCode }}</small></td><td>{{ entry.targetQuantity | number }}</td><td>{{ entry.actualQuantity | number }}</td><td>{{ entry.rejectedQuantity | number }}</td><td class="accepted">{{ entry.acceptedQuantity | number }}</td><td>{{ entry.kilnName || '—' }}<small>{{ entry.machineName || '' }}</small></td></tr> }</tbody></table></div> }</section>
      @if (formOpen()) { <div class="backdrop" (click)="formOpen.set(false)"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="production-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">DAILY PRODUCTION</p><h2 id="production-title">Record production</h2></div><button type="button" class="close" aria-label="Close" (click)="formOpen.set(false)"><mat-icon>close</mat-icon></button></header>
        @if (formError()) { <p class="feedback error" role="alert">{{ formError() }}</p> }
        <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
          <label>Product<select formControlName="productId" required><option [ngValue]="null">Select product</option>@for (product of products(); track product.id) { <option [ngValue]="product.id">{{ product.productCode }} · {{ product.productName }}</option> }</select></label>
          <label>Production date<input type="date" formControlName="productionDate" required></label>
          <label>Target quantity<input type="number" formControlName="targetQuantity" min="0" required></label>
          <label>Actual quantity<input type="number" formControlName="actualQuantity" min="0" required></label>
          <label>Rejected quantity<input type="number" formControlName="rejectedQuantity" min="0" required></label>
          <label>Raw material consumption<input type="number" formControlName="rawMaterialConsumption" min="0" step="0.001" required></label>
          <label>Kiln<input formControlName="kilnName" maxlength="100"></label><label>Machine<input formControlName="machineName" maxlength="100"></label>
          <label class="wide">Remarks<input formControlName="remarks" maxlength="1000"></label>
        </div><p class="stock-note">Accepted output (actual minus rejected) is posted to available inventory in the same transaction.</p><footer><button type="button" class="secondary-action" (click)="formOpen.set(false)">Cancel</button><button type="submit" class="primary-action" [disabled]="saving() || products().length === 0"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Save entry' }}</button></footer></form>
      </section></div> }
    </section>
  `,
  styles: [`
    :host { display:block; --line:#e6e9e5; --muted:#7b8680; }.page-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}.eyebrow{margin:0 0 8px;color:#829088;font-size:9px;font-weight:700;letter-spacing:1px}h1{margin:0;color:#20332a;font:700 26px Manrope,sans-serif}.description{margin:8px 0 0;color:var(--muted);font-size:12px}.primary-action,.secondary-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:0 13px;border:0;border-radius:5px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action{color:#fff;background:#24554b}.primary-action:disabled{opacity:.6}.primary-action mat-icon{width:17px;height:17px;font-size:17px}.secondary-action{color:#41564b;background:#fff;border:1px solid #dfe5df}.metric-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:14px}.metric-row article{display:grid;gap:8px;padding:14px;background:#fff;border:1px solid var(--line);border-radius:6px;color:#7a877f;font-size:10px}.metric-row strong{color:#273a31;font:700 20px Manrope,sans-serif}.table-panel{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:7px}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{padding:12px;color:#89948d;background:#fafbf9;border-bottom:1px solid var(--line);font-size:8px;letter-spacing:.6px}td{padding:12px;color:#58675e;border-bottom:1px solid #eef0ed;font-size:10px}td strong,td small{display:block}td strong{color:#2b3d34}td small{margin-top:4px;color:#929b95;font-size:9px}.accepted{color:#327557;font-weight:700}.empty{min-height:130px;display:grid;place-items:center;color:#77827b;font-size:11px}.feedback{margin:0 0 12px;padding:10px 12px;border-radius:5px;font-size:11px}.feedback.success{color:#286346;background:#edf6ef}.feedback.error{color:#9d4c38;background:#fbefeb}.backdrop{position:fixed;z-index:50;inset:0;display:grid;place-items:center;padding:18px;background:#15251f66}.dialog{width:min(650px,100%);max-height:90vh;overflow:auto;padding:20px;background:#fff;border-radius:7px;box-shadow:0 20px 60px #10201833}.dialog header{display:flex;justify-content:space-between;margin-bottom:16px}.dialog h2{margin:0;color:#20332a;font:700 20px Manrope,sans-serif}.close{border:0;background:transparent;color:#65756b;cursor:pointer}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 13px}.form-grid label{display:grid;gap:5px;color:#647168;font-size:10px;font-weight:600}.form-grid input,.form-grid select{width:100%;height:35px;padding:0 9px;background:#fff;border:1px solid #dfe5df;border-radius:4px;font-size:11px}.form-grid .wide{grid-column:1/-1}.stock-note{padding:10px;color:#53705e;background:#f1f6f1;border-radius:4px;font-size:10px}.dialog footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}@media(max-width:560px){.page-heading{align-items:flex-start;flex-direction:column}.metric-row{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}.form-grid .wide{grid-column:auto}}
  `]
})
export class ProductionPageComponent implements OnInit {
  private readonly operations = inject(OperationsApiService);
  private readonly productsApi = inject(ProductOrderApiService);
  private readonly fb = inject(FormBuilder);
  readonly entries = signal<ProductionEntry[]>([]);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  readonly acceptedTotal = () => this.entries().reduce((sum, entry) => sum + entry.acceptedQuantity, 0);
  readonly rejectedTotal = () => this.entries().reduce((sum, entry) => sum + entry.rejectedQuantity, 0);
  readonly form = this.fb.group({
    productId: [null as number | null, Validators.required], productionDate: [new Date().toISOString().slice(0, 10), Validators.required],
    targetQuantity: [0, [Validators.required, Validators.min(0)]], actualQuantity: [0, [Validators.required, Validators.min(0)]],
    rejectedQuantity: [0, [Validators.required, Validators.min(0)]], rawMaterialConsumption: [0, [Validators.required, Validators.min(0)]],
    kilnName: [''], machineName: [''], remarks: ['']
  });

  ngOnInit(): void {
    this.load();
    this.productsApi.products().subscribe({ next: (response) => this.products.set(response.data.content.filter((product) => product.active)), error: () => this.error.set('Could not load products.') });
  }

  load(): void {
    this.loading.set(true);
    this.operations.production().subscribe({ next: (response) => { this.entries.set(response.data.content); this.loading.set(false); }, error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not load production entries.'); this.loading.set(false); } });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.formError.set('Complete the required fields with valid quantities.'); return; }
    const value = this.form.getRawValue();
    const request: ProductionRequest = { productId: Number(value.productId), productionDate: value.productionDate!, targetQuantity: Number(value.targetQuantity), actualQuantity: Number(value.actualQuantity), rejectedQuantity: Number(value.rejectedQuantity), rawMaterialConsumption: Number(value.rawMaterialConsumption), kilnName: value.kilnName ?? '', machineName: value.machineName ?? '', remarks: value.remarks ?? '' };
    this.saving.set(true);
    this.operations.createProduction(request).subscribe({ next: (response) => { this.message.set(`Production recorded. ${response.data.acceptedQuantity.toLocaleString()} accepted units posted to inventory.`); this.saving.set(false); this.formOpen.set(false); this.load(); }, error: (error: HttpErrorResponse) => { this.formError.set(error.error?.message ?? 'Could not record production.'); this.saving.set(false); } });
  }
}
