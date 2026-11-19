import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PageResult } from './customer-api.service';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  orderNumber: string;
  customerName: string;
  invoiceDate: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  invoiceAmount: number;
}

@Injectable({ providedIn: 'root' })
export class InvoiceApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/invoices';

  list(query: string, page: number, size = 20): Observable<ApiResponse<PageResult<Invoice>>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'invoiceDate,desc');
    if (query.trim()) params = params.set('q', query.trim());
    return this.http.get<ApiResponse<PageResult<Invoice>>>(this.endpoint, { params });
  }
}
