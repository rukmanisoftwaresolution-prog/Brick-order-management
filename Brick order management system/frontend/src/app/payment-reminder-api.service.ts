import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from './customer-api.service';
import { PaymentReminderChannel } from './invoice-api.service';

@Injectable({ providedIn: 'root' })
export class PaymentReminderApiService {
  private readonly http = inject(HttpClient);

  send(customerId: number, invoiceId: number, channel: PaymentReminderChannel): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`/api/v1/customers/${customerId}/payment-reminders`, { invoiceId, channel });
  }
}
