import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PageResult } from './customer-api.service';
import { SalesOrder } from './product-order-api.service';

export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
export type PaymentReminderChannel = 'WHATSAPP' | 'SMS';

export interface Invoice {
  id: number;
  invoiceNumber: string;
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  invoiceDate: string;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  invoiceAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: InvoicePaymentStatus;
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

  openForCustomer(customerId: number): Observable<ApiResponse<PageResult<Invoice>>> {
    const params = new HttpParams().set('page', 0).set('size', 100)
      .set('customerId', customerId).set('openOnly', true).set('sort', 'invoiceDate,desc');
    return this.http.get<ApiResponse<PageResult<Invoice>>>(this.endpoint, { params });
  }

  eligibleOrders(): Observable<ApiResponse<PageResult<SalesOrder>>> {
    const params = new HttpParams().set('page', 0).set('size', 100).set('sort', 'orderDate,desc');
    return this.http.get<ApiResponse<PageResult<SalesOrder>>>(`${this.endpoint}/eligible-orders`, { params });
  }

  generate(orderId: number): Observable<ApiResponse<Invoice>> {
    return this.http.post<ApiResponse<Invoice>>(this.endpoint, { orderId });
  }
}
