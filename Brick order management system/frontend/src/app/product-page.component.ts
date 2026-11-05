import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Product, ProductOrderApiService, ProductRequest } from './product-order-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <section class="catalog-page">
      <header class="page-heading"><div><p class="eyebrow">OPERATIONS / PRODUCTS</p><h1>Products</h1><p class="description">Brick catalogue, rates and minimum stock levels.</p></div><button class="primary-action" type="button" (click)="formOpen.set(true)"><mat-icon>add</mat-icon>Add product</button></header>
      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> }
      @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      <div class="toolbar"><label class="search"><mat-icon>search</mat-icon><input [value]="query()" (input)="query.set($any($event.target).value)" (keydown.enter)="load()" placeholder="Search product name or code" aria-label="Search products"></label><button class="secondary-action" type="button" (click)="load()">Search</button></div>
      <section class="table-panel">
        @if (loading()) { <p class="empty">Loading products...</p> }
        @else if (products().length === 0) { <p class="empty">No products found. Add the first catalogue item.</p> }
        @else { <div class="table-scroll"><table><thead><tr><th>CODE / PRODUCT</th><th>SIZE</th><th>RATE</th><th>GST</th><th>OPENING STOCK</th><th>MINIMUM</th><th>STATUS</th></tr></thead><tbody>@for (product of products(); track product.id) { <tr><td><strong>{{ product.productName }}</strong><small>{{ product.productCode }}</small></td><td>{{ product.size || '—' }}</td><td>{{ product.currentRate | currency:'INR':'symbol':'1.2-2' }}</td><td>{{ product.gstPercentage }}%</td><td>{{ product.openingStock | number }}</td><td>{{ product.minimumStock | number }}</td><td><span class="status-pill" [class.inactive]="!product.active">{{ product.active ? 'Active' : 'Inactive' }}</span></td></tr> }</tbody></table></div> }
      </section>
      @if (formOpen()) { <div class="backdrop" (click)="formOpen.set(false)"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="product-form-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">PRODUCT CATALOGUE</p><h2 id="product-form-title">Add product</h2></div><button type="button" class="icon-button" aria-label="Close" (click)="formOpen.set(false)"><mat-icon>close</mat-icon></button></header>
        @if (formError()) { <p class="feedback error" role="alert">{{ formError() }}</p> }
        <form [formGroup]="form" (ngSubmit)="save()"><div class="form-grid">
          <label>Product code<input formControlName="productCode" maxlength="30" required></label><label>Product name<input formControlName="productName" maxlength="120" required></label>
          <label>Size<input formControlName="size" maxlength="80"></label><label>Weight (kg)<input formControlName="weightKg" type="number" min="0" step="0.001"></label>
          <label>Rate (₹)<input formControlName="currentRate" type="number" min="0" step="0.01" required></label><label>GST %<input formControlName="gstPercentage" type="number" min="0" max="100" step="0.01" required></label>
          <label>Opening stock<input formControlName="openingStock" type="number" min="0" step="1" required></label><label>Minimum stock<input formControlName="minimumStock" type="number" min="0" step="1" required></label>
          <label class="check"><input type="checkbox" formControlName="active"> Active product</label>
        </div><footer><button type="button" class="secondary-action" (click)="formOpen.set(false)">Cancel</button><button type="submit" class="primary-action" [disabled]="saving()"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Save product' }}</button></footer></form>
      </section></div> }
    </section>
  `,
  styles: [`
    :host { display:block; --line:#e6e9e5; --muted:#7b8680; }.page-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin-bottom:22px; }.eyebrow { margin:0 0 8px; color:#829088; font-size:9px; font-weight:700; letter-spacing:1px; }h1 { margin:0; color:#20332a; font:700 26px Manrope,sans-serif; }.description { margin:8px 0 0; color:var(--muted); font-size:12px; }.primary-action,.secondary-action { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:37px; padding:0 13px; border:0; border-radius:5px; font:600 11px 'DM Sans',sans-serif; cursor:pointer; }.primary-action { color:white; background:#24554b; }.primary-action:disabled { opacity:.6; }.secondary-action { color:#41564b; background:white; border:1px solid #dfe5df; }.primary-action mat-icon { width:17px; height:17px; font-size:17px; }.toolbar { display:flex; gap:9px; margin-bottom:12px; }.search { display:flex; align-items:center; gap:8px; width:min(440px,100%); height:37px; padding:0 10px; color:#839087; background:white; border:1px solid #e1e6e1; border-radius:5px; }.search mat-icon { width:17px; height:17px; font-size:17px; }.search input { flex:1; min-width:0; border:0; outline:0; font-size:11px; }.table-panel { overflow:hidden; background:white; border:1px solid var(--line); border-radius:7px; }.table-scroll { overflow-x:auto; }table { width:100%; border-collapse:collapse; text-align:left; white-space:nowrap; }th { padding:12px 14px; color:#89948d; background:#fafbf9; border-bottom:1px solid var(--line); font-size:8px; letter-spacing:.6px; }td { padding:12px 14px; color:#58675e; border-bottom:1px solid #eef0ed; font-size:10px; }td strong,td small { display:block; }td strong { color:#2b3d34; font-size:11px; }td small { margin-top:4px; color:#929b95; font-size:9px; }.status-pill { padding:4px 7px; color:#397857; background:#edf5ef; border-radius:4px; font-size:9px; }.status-pill.inactive { color:#77827b; background:#eff1ef; }.empty { min-height:130px; display:grid; place-items:center; color:#77827b; font-size:11px; }.feedback { margin:0 0 12px; padding:10px 12px; border-radius:5px; font-size:11px; }.feedback.success { color:#286346; background:#edf6ef; }.feedback.error { color:#9d4c38; background:#fbefeb; }.backdrop { position:fixed; z-index:50; inset:0; display:grid; place-items:center; padding:18px; background:#15251f66; }.dialog { width:min(600px,100%); max-height:90vh; overflow:auto; padding:20px; background:white; border-radius:7px; box-shadow:0 20px 60px #10201833; }.dialog header { display:flex; justify-content:space-between; margin-bottom:16px; }.dialog h2 { margin:0; color:#20332a; font:700 20px Manrope,sans-serif; }.icon-button { border:0; background:transparent; color:#65756b; cursor:pointer; }.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px 13px; }.form-grid label { display:grid; gap:5px; color:#647168; font-size:10px; font-weight:600; }.form-grid input:not([type=checkbox]) { height:35px; padding:0 9px; border:1px solid #dfe5df; border-radius:4px; font-size:11px; }.form-grid .check { display:flex; align-items:center; gap:8px; }.dialog footer { display:flex; justify-content:flex-end; gap:8px; margin-top:19px; }@media(max-width:560px){.page-heading{align-items:flex-start;flex-direction:column}.form-grid{grid-template-columns:1fr}}
  `]
})
export class ProductPageComponent implements OnInit {
  private readonly api = inject(ProductOrderApiService);
  private readonly fb = inject(FormBuilder);
  readonly products = signal<Product[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly error = signal('');
  readonly formError = signal('');
  readonly message = signal('');
  readonly query = signal('');
  readonly form = this.fb.group({
    productCode: ['', [Validators.required, Validators.maxLength(30)]],
    productName: ['', [Validators.required, Validators.maxLength(120)]],
    size: [''], weightKg: [null as number | null, Validators.min(0)],
    gstPercentage: [5, [Validators.required, Validators.min(0), Validators.max(100)]],
    currentRate: [0, [Validators.required, Validators.min(0)]],
    openingStock: [0, [Validators.required, Validators.min(0)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]], active: [true]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.products(this.query()).subscribe({
      next: (response) => { this.products.set(response.data.content); this.loading.set(false); },
      error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not load products.'); this.loading.set(false); }
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.formError.set('Complete the required fields with valid non-negative values.'); return; }
    const value = this.form.getRawValue();
    const request: ProductRequest = {
      ...value,
      weightKg: value.weightKg === null ? null : Number(value.weightKg),
      currentRate: Number(value.currentRate), gstPercentage: Number(value.gstPercentage),
      openingStock: Number(value.openingStock), minimumStock: Number(value.minimumStock)
    } as ProductRequest;
    this.saving.set(true);
    this.api.createProduct(request).subscribe({
      next: (response) => { this.message.set(response.message); this.formOpen.set(false); this.saving.set(false); this.form.reset({ productCode: '', productName: '', size: '', weightKg: null, gstPercentage: 5, currentRate: 0, openingStock: 0, minimumStock: 0, active: true }); this.load(); },
      error: (error: HttpErrorResponse) => { this.formError.set(error.error?.message ?? 'Could not save product.'); this.saving.set(false); }
    });
  }
}
