import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from './customer-api.service';

export interface OperationsReport {
  fromDate: string | null;
  toDate: string | null;
  orderCount: number;
  orderValue: number;
  paymentCount: number;
  paymentTotal: number;
  deliveryCount: number;
  productionEntryCount: number;
  producedQuantity: number;
  rejectedQuantity: number;
  productCount: number;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  deliveredStock: number;
}

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/reports/operations';

  operations(fromDate: string, toDate: string): Observable<ApiResponse<OperationsReport>> {
    let params = new HttpParams();
    if (fromDate) params = params.set('from', fromDate);
    if (toDate) params = params.set('to', toDate);
    return this.http.get<ApiResponse<OperationsReport>>(this.endpoint, { params });
  }
}
