import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PageResult } from './customer-api.service';
import { SalesOrder } from './product-order-api.service';

export interface Vehicle {
  id: number;
  vehicleNumber: string;
  driverName: string;
  driverMobile: string | null;
}

export interface DeliveryLine {
  orderItemId: number;
  productCode: string;
  productName: string;
  quantity: number;
}

export type DeliveryStatus = 'PENDING' | 'LOADING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface Delivery {
  id: number;
  deliveryNumber: string;
  orderNumber: string;
  customerName: string;
  vehicleNumber: string | null;
  driverName: string | null;
  status: DeliveryStatus;
  deliveryAddress: string;
  challanNumber: string;
  createdAt: string;
  items: DeliveryLine[];
}

export interface DeliveryRequest {
  orderId: number;
  vehicleId: number | null;
  deliveryAddress: string;
  remarks: string;
  items: { orderItemId: number; quantity: number }[];
}

export interface DeliveryStatusRequest {
  status: DeliveryStatus;
}

export interface Payment {
  id: number;
  customerId: number;
  customerCode: string;
  customerName: string;
  orderNumber: string | null;
  paymentDate: string;
  createdAt: string;
  amount: number;
  paymentType: string;
  referenceNumber: string | null;
  remarks: string | null;
  invoiceNumber: string | null;
  paymentStatus: 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REVERSED';
}

export interface PaymentRequest {
  customerId: number;
  orderId?: number | null;
  invoiceId: number;
  amount: number;
  paymentType: 'CASH' | 'UPI' | 'PHONEPE' | 'BANK_TRANSFER' | 'OTHER' | 'CHEQUE';
  paymentDate: string;
  referenceNumber: string;
  idempotencyKey: string;
  remarks: string;
}

@Injectable({ providedIn: 'root' })
export class LogisticsApiService {
  private readonly http = inject(HttpClient);
  private readonly deliveriesUrl = '/api/v1/deliveries';
  private readonly paymentsUrl = '/api/v1/payments';
  private readonly vehiclesUrl = '/api/v1/vehicles';

  deliveries(): Observable<ApiResponse<PageResult<Delivery>>> {
    const params = new HttpParams().set('page', 0).set('size', 50);
    return this.http.get<ApiResponse<PageResult<Delivery>>>(this.deliveriesUrl, { params });
  }
  createDelivery(request: DeliveryRequest): Observable<ApiResponse<Delivery>> {
    return this.http.post<ApiResponse<Delivery>>(this.deliveriesUrl, request);
  }
  updateDeliveryStatus(id: number, status: DeliveryStatus): Observable<ApiResponse<Delivery>> {
    return this.http.patch<ApiResponse<Delivery>>(`${this.deliveriesUrl}/${id}/status`, { status });
  }
  vehicles(): Observable<ApiResponse<Vehicle[]>> {
    return this.http.get<ApiResponse<Vehicle[]>>(this.vehiclesUrl);
  }
  payments(): Observable<ApiResponse<PageResult<Payment>>> {
    const params = new HttpParams().set('page', 0).set('size', 50);
    return this.http.get<ApiResponse<PageResult<Payment>>>(this.paymentsUrl, { params });
  }
  customerPayments(customerId: number): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.paymentsUrl}/customer/${customerId}`);
  }
  createPayment(request: PaymentRequest): Observable<ApiResponse<Payment>> {
    return this.http.post<ApiResponse<Payment>>(this.paymentsUrl, request);
  }
}
