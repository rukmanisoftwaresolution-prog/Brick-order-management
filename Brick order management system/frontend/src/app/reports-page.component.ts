import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { OperationsReport, ReportsApiService } from './reports-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="reports-page">
      <header class="page-heading"><div><p class="eyebrow">ANALYTICS / REPORTS</p><h1>Reports</h1><p class="description">Operational summaries from sales, collections, dispatch, production and current stock.</p></div></header>
      <form class="filters" (submit)="$event.preventDefault(); load(fromInput.value, toInput.value)">
        <label>From<input #fromInput type="date" [value]="fromDate()"></label><label>To<input #toInput type="date" [value]="toDate()"></label><button class="primary-action" type="submit" [disabled]="loading()"><mat-icon>filter_alt</mat-icon>Apply dates</button>
      </form>
      @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      @if (loading()) { <section class="report-panel empty" aria-live="polite">Loading reports...</section> }
      @else {
        @if (report(); as summary) {
          <p class="range-note">Date range: {{ summary.fromDate || 'All time' }} to {{ summary.toDate || 'All time' }}. Inventory figures are current balances and are not date-filtered.</p>
          @if (!hasActivity()) { <section class="report-panel empty" role="status">No activity or stock was recorded for this range.</section> }
          <div class="metric-grid">
            <article><span>Orders</span><strong>{{ summary.orderCount }}</strong><small>Order value: {{ summary.orderValue | currency:'INR':'symbol':'1.2-2' }}</small></article>
            <article><span>Payments</span><strong>{{ summary.paymentCount }}</strong><small>Received: {{ summary.paymentTotal | currency:'INR':'symbol':'1.2-2' }}</small></article>
            <article><span>Deliveries</span><strong>{{ summary.deliveryCount }}</strong><small>Created in selected dates</small></article>
            <article><span>Production entries</span><strong>{{ summary.productionEntryCount }}</strong><small>{{ summary.producedQuantity }} produced · {{ summary.rejectedQuantity }} rejected</small></article>
          </div>
          <section class="stock-panel"><div class="section-title"><span class="section-icon"><mat-icon>inventory_2</mat-icon></span><div><h2>Current inventory</h2><p>Balances across {{ summary.productCount }} tracked products</p></div></div><div class="stock-grid"><article><span>Available</span><strong>{{ summary.availableStock }}</strong></article><article><span>Reserved</span><strong>{{ summary.reservedStock }}</strong></article><article><span>Damaged</span><strong>{{ summary.damagedStock }}</strong></article><article><span>Delivered</span><strong>{{ summary.deliveredStock }}</strong></article></div></section>
        }
      }
    </section>
  `,
  styles: [`
    :host{display:block;--line:#e6e9e5;--muted:#7b8680}.page-heading{margin-bottom:20px}.eyebrow{margin:0 0 8px;color:#829088;font-size:9px;font-weight:700;letter-spacing:1px}h1{margin:0;color:#20332a;font:700 26px Manrope,sans-serif}.description{margin:8px 0 0;color:var(--muted);font-size:12px}.filters{display:flex;align-items:flex-end;gap:12px;margin-bottom:14px;padding:14px;background:#fff;border:1px solid var(--line);border-radius:6px}.filters label{display:grid;gap:5px;color:#647168;font-size:10px;font-weight:600}.filters input{height:35px;padding:0 9px;border:1px solid #dfe5df;border-radius:4px;color:#35443c;font-size:11px}.primary-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:35px;padding:0 12px;color:#fff;background:#24554b;border:0;border-radius:5px;font:600 10px 'DM Sans',sans-serif;cursor:pointer}.primary-action:disabled{opacity:.6}.primary-action mat-icon{width:16px;height:16px;font-size:16px}.range-note{margin:0 0 12px;color:#75827a;font-size:10px}.metric-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metric-grid article,.stock-grid article{display:grid;gap:8px;padding:15px;background:#fff;border:1px solid var(--line);border-radius:6px;color:#7a877f;font-size:10px}.metric-grid strong{color:#273a31;font:700 21px Manrope,sans-serif}.metric-grid small{color:#65756b;font-size:10px}.stock-panel{margin-top:14px;padding:16px;background:#fff;border:1px solid var(--line);border-radius:7px}.section-title{display:flex;align-items:center;gap:10px;margin-bottom:13px}.section-icon{width:32px;height:32px;display:grid;place-items:center;color:#34715c;background:#eaf3ed;border-radius:6px}.section-icon mat-icon{font-size:18px}.section-title h2{margin:0;color:#26372e;font:700 13px Manrope,sans-serif}.section-title p{margin:4px 0 0;color:#87928a;font-size:10px}.stock-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.stock-grid article{padding:12px;background:#fafbf9}.stock-grid strong{color:#273a31;font:700 18px Manrope,sans-serif}.report-panel{background:#fff;border:1px solid var(--line);border-radius:7px}.empty{min-height:100px;display:grid;place-items:center;color:#77827b;font-size:11px}.feedback{margin:0 0 12px;padding:10px 12px;border-radius:5px;font-size:11px}.feedback.error{color:#9d4c38;background:#fbefeb}@media(max-width:800px){.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.filters{align-items:stretch;flex-direction:column}.filters label,.filters input{width:100%}.metric-grid,.stock-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `]
})
export class ReportsPageComponent implements OnInit {
  private readonly api = inject(ReportsApiService);
  private readonly reportRequests = new Subject<{ fromDate: string; toDate: string }>();
  readonly report = signal<OperationsReport | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly fromDate = signal(this.firstOfMonth());
  readonly toDate = signal(this.today());
  readonly hasActivity = computed(() => {
    const summary = this.report();
    return !!summary && (
      summary.orderCount > 0 || summary.paymentCount > 0 || summary.deliveryCount > 0 ||
      summary.productionEntryCount > 0 || summary.productCount > 0
    );
  });

  constructor() {
    this.reportRequests.pipe(
      switchMap(({ fromDate, toDate }) => this.api.operations(fromDate, toDate).pipe(
        tap((response) => {
          this.report.set(response.data);
          this.loading.set(false);
        }),
        catchError((error: HttpErrorResponse) => {
          this.error.set(error.error?.message ?? 'Could not load reports.');
          this.loading.set(false);
          return EMPTY;
        })
      )),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe();
  }

  ngOnInit(): void {
    this.load(this.fromDate(), this.toDate());
  }

  load(fromDate: string, toDate: string): void {
    if (fromDate && toDate && fromDate > toDate) {
      this.error.set('The start date must be on or before the end date.');
      return;
    }
    this.fromDate.set(fromDate);
    this.toDate.set(toDate);
    this.error.set('');
    this.report.set(null);
    this.loading.set(true);
    this.reportRequests.next({ fromDate, toDate });
  }

  private today(): string {
    return this.toDateInputValue(new Date());
  }

  private firstOfMonth(): string {
    const today = new Date();
    return this.toDateInputValue(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  private toDateInputValue(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
}
