import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PageResult } from './customer-api.service';

export interface Product {
  id: number;
  productCode: string;
  productName: string;
  size: string | null;
  weightKg: number | null;
  gstPercentage: number;
  currentRate: number;
  openingStock: number;
  minimumStock: number;
  active: boolean;
}

export type ProductRequest = Omit<Product, 'id'>;

export interface OrderLine {
  orderItemId: number;
  productId: number;
  productCode: string;
  productName: string;
  quantity: number;
  rate: number;
  discount: number;
  gstPercentage: number;
  amount: number;
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  orderDate: string;
  requiredDeliveryDate: string | null;
  deliveryAddress: string;
  transportationMode: string | null;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  items: OrderLine[];
}

export interface OrderRequest {
  customerId: number;
  requiredDeliveryDate: string | null;
  deliveryAddress: string;
  transportationMode: string;
  remarks: string;
  items: { productId: number; quantity: number; rate: number; discount: number }[];
}

@Injectable({ providedIn: 'root' })
export class ProductOrderApiService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = '/api/v1/products';
  private readonly ordersUrl = '/api/v1/orders';

  products(query = ''): Observable<ApiResponse<PageResult<Product>>> {
    let params = new HttpParams().set('page', 0).set('size', 100).set('sort', 'productName,asc');
    if (query.trim()) params = params.set('q', query.trim());
    return this.http.get<ApiResponse<PageResult<Product>>>(this.productsUrl, { params });
  }

  createProduct(request: ProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.productsUrl, request);
  }

  orders(query = ''): Observable<ApiResponse<PageResult<SalesOrder>>> {
    let params = new HttpParams().set('page', 0).set('size', 50).set('sort', 'orderDate,desc');
    if (query.trim()) params = params.set('q', query.trim());
    return this.http.get<ApiResponse<PageResult<SalesOrder>>>(this.ordersUrl, { params });
  }

  createOrder(request: OrderRequest): Observable<ApiResponse<SalesOrder>> {
    return this.http.post<ApiResponse<SalesOrder>>(this.ordersUrl, request);
  }

  confirmOrder(id: number): Observable<ApiResponse<SalesOrder>> {
    return this.http.post<ApiResponse<SalesOrder>>(`${this.ordersUrl}/${id}/confirm`, {});
  }

  deleteDraft(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.ordersUrl}/${id}`);
  }
}
