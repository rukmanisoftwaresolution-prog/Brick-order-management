import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { Invoice, InvoiceApiService } from './invoice-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <section class="invoices-page">
      <header class="page-heading"><div><p class="eyebrow">FINANCE / INVOICES</p><h1>Invoices</h1><p class="description">Issued invoices linked to sales orders.</p></div></header>
      @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      <form class="search" (submit)="$event.preventDefault(); load(searchInput.value, 0)">
        <mat-icon>search</mat-icon><input #searchInput aria-label="Search invoices" placeholder="Search invoice, order or customer" [value]="query()" (input)="query.set(searchInput.value)">
        <button type="submit">Search</button>
      </form>
      <section class="table-panel" aria-live="polite">
        @if (loading()) { <p class="empty">Loading invoices...</p> }
        @else if (invoices().length === 0) { <p class="empty">{{ query() ? 'No invoices match your search.' : 'No invoices have been issued.' }}</p> }
        @else {
          <div class="table-scroll"><table><thead><tr><th>INVOICE</th><th>DATE</th><th>CUSTOMER</th><th>ORDER</th><th>TAXABLE</th><th>CGST</th><th>SGST</th><th>IGST</th><th>TOTAL</th></tr></thead><tbody>
            @for (invoice of invoices(); track invoice.id) {
              <tr><td class="strong">{{ invoice.invoiceNumber }}</td><td>{{ invoice.invoiceDate | date:'dd MMM yyyy' }}</td><td>{{ invoice.customerName }}</td><td>{{ invoice.orderNumber }}</td><td>{{ invoice.taxableAmount | currency:'INR':'symbol':'1.2-2' }}</td><td>{{ invoice.cgst | currency:'INR':'symbol':'1.2-2' }}</td><td>{{ invoice.sgst | currency:'INR':'symbol':'1.2-2' }}</td><td>{{ invoice.igst | currency:'INR':'symbol':'1.2-2' }}</td><td class="money">{{ invoice.invoiceAmount | currency:'INR':'symbol':'1.2-2' }}</td></tr>
            }
          </tbody></table></div>
          <footer class="pagination"><span>{{ totalElements() }} invoice{{ totalElements() === 1 ? '' : 's' }}</span><div><button type="button" [disabled]="page() === 0 || loading()" (click)="load(query(), page() - 1)">Previous</button><span>Page {{ page() + 1 }} of {{ totalPages() }}</span><button type="button" [disabled]="page() + 1 >= totalPages() || loading()" (click)="load(query(), page() + 1)">Next</button></div></footer>
        }
      </section>
    </section>
  `,
  styles: [`
    :host{display:block;--line:#e6e9e5;--muted:#7b8680}.page-heading{margin-bottom:20px}.eyebrow{margin:0 0 8px;color:#829088;font-size:9px;font-weight:700;letter-spacing:1px}h1{margin:0;color:#20332a;font:700 26px Manrope,sans-serif}.description{margin:8px 0 0;color:var(--muted);font-size:12px}.search{display:flex;align-items:center;gap:8px;max-width:520px;margin-bottom:14px;padding:5px 7px 5px 10px;background:#fff;border:1px solid var(--line);border-radius:5px}.search mat-icon{color:#87938b;font-size:19px}.search input{flex:1;min-width:0;height:29px;border:0;outline:0;color:#34443a;font-size:11px}.search button,.pagination button{padding:7px 10px;color:#fff;background:#24554b;border:0;border-radius:4px;font-size:10px;cursor:pointer}.table-panel{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:7px}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}th{padding:12px;color:#89948d;background:#fafbf9;border-bottom:1px solid var(--line);font-size:8px;letter-spacing:.6px}td{padding:12px;color:#58675e;border-bottom:1px solid #eef0ed;font-size:10px}.strong{color:#344c3e;font-weight:700}.money{color:#327557;font-weight:700}.empty{min-height:130px;display:grid;place-items:center;color:#77827b;font-size:11px}.feedback{margin:0 0 12px;padding:10px 12px;border-radius:5px;font-size:11px}.feedback.error{color:#9d4c38;background:#fbefeb}.pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;color:#77827b;font-size:10px}.pagination>div{display:flex;align-items:center;gap:10px}.pagination button{color:#41564b;background:#fff;border:1px solid #dfe5df}.pagination button:disabled{opacity:.5;cursor:default}@media(max-width:560px){.pagination{align-items:flex-start;flex-direction:column}.pagination>div{width:100%;justify-content:space-between}}
  `]
})
export class InvoicePageComponent implements OnInit {
  private readonly api = inject(InvoiceApiService);
  private readonly searchRequests = new Subject<{ query: string; page: number }>();
  readonly invoices = signal<Invoice[]>([]);
  readonly query = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    this.searchRequests.pipe(
      switchMap(({ query, page }) => this.api.list(query, page).pipe(
        tap((response) => {
          this.invoices.set(response.data.content);
          this.query.set(query);
          this.page.set(response.data.number);
          this.totalPages.set(response.data.totalPages);
          this.totalElements.set(response.data.totalElements);
          this.loading.set(false);
        }),
        catchError((error: HttpErrorResponse) => {
          this.error.set(error.error?.message ?? 'Could not load invoices.');
          this.loading.set(false);
          return EMPTY;
        })
      )),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe();
  }

  ngOnInit(): void {
    this.load('', 0);
  }

  load(query: string, page: number): void {
    this.loading.set(true);
    this.error.set('');
    this.invoices.set([]);
    this.totalElements.set(0);
    this.totalPages.set(0);
    this.searchRequests.next({ query, page });
  }
}
