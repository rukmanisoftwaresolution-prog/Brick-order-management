import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from './customer-api.service';

export interface AppSettings {
  profileName: string;
  profileEmail: string;
  mobileNumber: string;
  role: string;
  plantName: string;
  plantAddress: string;
  plantStatus: string;
}

export type SettingsUpdate = Omit<AppSettings, 'role'>;

const DEFAULT_SETTINGS: AppSettings = {
  profileName: 'Aarav Kumar',
  profileEmail: '',
  mobileNumber: '',
  role: 'Administrator',
  plantName: 'North plant',
  plantAddress: '',
  plantStatus: 'OPERATIONAL'
};

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);
  readonly value = signal(DEFAULT_SETTINGS);
  private readonly endpoint = '/api/v1/settings';

  load(): Observable<ApiResponse<AppSettings>> {
    return this.http.get<ApiResponse<AppSettings>>(this.endpoint).pipe(tap((response) => this.value.set(response.data)));
  }

  save(update: SettingsUpdate): Observable<ApiResponse<AppSettings>> {
    return this.http.put<ApiResponse<AppSettings>>(this.endpoint, update).pipe(tap((response) => this.value.set(response.data)));
  }
}
