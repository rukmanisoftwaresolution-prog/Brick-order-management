import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, PageResult } from './customer-api.service';
import { Product } from './product-order-api.service';

export interface ProductionEntry {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  productionDate: string;
  targetQuantity: number;
  actualQuantity: number;
  rejectedQuantity: number;
  acceptedQuantity: number;
  rawMaterialConsumption: number;
  kilnName: string | null;
  machineName: string | null;
  remarks: string | null;
}

export interface ProductionRequest {
  productId: number;
  productionDate: string;
  targetQuantity: number;
  actualQuantity: number;
  rejectedQuantity: number;
  rawMaterialConsumption: number;
  kilnName: string;
  machineName: string;
  remarks: string;
}

export interface InventoryRow {
  productId: number;
  productCode: string;
  productName: string;
  availableStock: number;
  reservedStock: number;
  damagedStock: number;
  deliveredStock: number;
  updatedAt: string;
}

export interface InventoryAdjustment {
  productId: number;
  transactionType: 'RECEIPT' | 'DAMAGE' | 'STOCKTAKE_INCREASE' | 'STOCKTAKE_DECREASE';
  quantity: number;
  remarks: string;
}

@Injectable({ providedIn: 'root' })
export class OperationsApiService {
  private readonly http = inject(HttpClient);
  private readonly productionUrl = '/api/v1/production-entries';
  private readonly inventoryUrl = '/api/v1/inventory';

  production(): Observable<ApiResponse<PageResult<ProductionEntry>>> {
    const params = new HttpParams().set('page', 0).set('size', 50).set('sort', 'productionDate,desc');
    return this.http.get<ApiResponse<PageResult<ProductionEntry>>>(this.productionUrl, { params });
  }

  createProduction(request: ProductionRequest): Observable<ApiResponse<ProductionEntry>> {
    return this.http.post<ApiResponse<ProductionEntry>>(this.productionUrl, request);
  }

  inventory(): Observable<ApiResponse<PageResult<InventoryRow>>> {
    const params = new HttpParams().set('page', 0).set('size', 100);
    return this.http.get<ApiResponse<PageResult<InventoryRow>>>(this.inventoryUrl, { params });
  }

  adjustInventory(request: InventoryAdjustment): Observable<ApiResponse<InventoryRow>> {
    return this.http.post<ApiResponse<InventoryRow>>(`${this.inventoryUrl}/adjustments`, request);
  }
}
