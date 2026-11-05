import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface Customer {
  id: number;
  customerCode: string;
  customerName: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contactPerson: string | null;
  mobileNumber: string | null;
  email: string | null;
  creditLimit: number;
  outstandingAmount: number;
  active: boolean;
}

export type CustomerRequest = Omit<Customer, 'id' | 'outstandingAmount'>;

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = '/api/v1/customers';

  list(query: string, active: string, page: number, size: number): Observable<ApiResponse<PageResult<Customer>>> {
    let params = new HttpParams().set('page', page).set('size', size).set('sort', 'customerName,asc');
    if (query.trim()) params = params.set('q', query.trim());
    if (active !== 'all') params = params.set('active', active);
    return this.http.get<ApiResponse<PageResult<Customer>>>(this.endpoint, { params });
  }

  create(request: CustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.endpoint, request);
  }

  update(id: number, request: CustomerRequest): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.endpoint}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}
