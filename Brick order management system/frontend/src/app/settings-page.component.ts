import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { SettingsApiService, SettingsUpdate } from './settings-api.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <section class="settings-page">
      <header class="page-heading"><div><p class="eyebrow">ADMINISTRATION / SETTINGS</p><h1>Settings</h1><p class="description">Profile and plant details used throughout this workspace.</p></div></header>
      @if (message()) { <p class="feedback success" role="status">{{ message() }}</p> }
      @if (error()) { <p class="feedback error" role="alert">{{ error() }}</p> }
      @if (loading()) { <div class="settings-panel loading">Loading settings...</div> }
      @else {
        <form class="settings-panel" [formGroup]="form" (ngSubmit)="save()">
          <section class="settings-section"><div class="section-heading"><span class="section-icon"><mat-icon>person</mat-icon></span><div><h2>Profile</h2><p>Contact details shown in the workspace.</p></div></div>
            <div class="form-grid"><label>Display name<input formControlName="profileName" maxlength="120" required></label><label>Email<input formControlName="profileEmail" type="email" maxlength="254" required></label><label>Mobile number<input formControlName="mobileNumber" maxlength="20" inputmode="tel"></label><label>Role<input [value]="settings.value().role" disabled aria-label="Current role"></label></div>
          </section>
          <section class="settings-section"><div class="section-heading"><span class="section-icon plant"><mat-icon>factory</mat-icon></span><div><h2>Plant</h2><p>Current operating site details.</p></div></div>
            <div class="form-grid"><label>Plant name<input formControlName="plantName" maxlength="120" required></label><label>Plant status<select formControlName="plantStatus"><option value="OPERATIONAL">Operational</option><option value="ATTENTION">Attention required</option><option value="OFFLINE">Offline</option></select></label><label class="wide">Plant address<input formControlName="plantAddress" maxlength="250"></label></div>
          </section>
          <footer class="actions"><span class="saved-note">Changes are saved to the local development database.</span><button class="primary-action" type="submit" [disabled]="saving()"><mat-icon>save</mat-icon>{{ saving() ? 'Saving...' : 'Save settings' }}</button></footer>
        </form>
      }
    </section>
  `,
  styles: [`
    :host{display:block;--line:#e6e9e5;--muted:#7b8680}.page-heading{margin-bottom:20px}.eyebrow{margin:0 0 8px;color:#829088;font-size:9px;font-weight:700;letter-spacing:1px}h1{margin:0;color:#20332a;font:700 26px Manrope,sans-serif}.description{margin:8px 0 0;color:var(--muted);font-size:12px}.settings-panel{overflow:hidden;background:#fff;border:1px solid var(--line);border-radius:7px}.settings-panel.loading{padding:24px;color:var(--muted);font-size:12px}.settings-section{padding:20px 22px;border-bottom:1px solid var(--line)}.section-heading{display:flex;align-items:center;gap:12px;margin-bottom:18px}.section-icon{width:34px;height:34px;display:grid;place-items:center;color:#34715c;background:#eaf3ed;border-radius:6px}.section-icon.plant{color:#b17b42;background:#fbf2e7}.section-icon mat-icon{width:19px;height:19px;font-size:19px}.section-heading h2{margin:0;color:#26372e;font:700 14px Manrope,sans-serif}.section-heading p{margin:4px 0 0;color:#87928a;font-size:10px}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px 16px;padding-left:46px}.form-grid label{display:grid;gap:6px;color:#5e6d63;font-size:10px;font-weight:600}.form-grid input,.form-grid select{width:100%;height:37px;padding:0 10px;color:#27372e;background:#fff;border:1px solid #dfe5df;border-radius:4px;font-size:11px}.form-grid input:disabled{color:#7d8881;background:#f4f6f3}.form-grid .wide{grid-column:1/-1}.actions{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 22px}.saved-note{color:#89948d;font-size:10px}.primary-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:37px;padding:0 13px;color:white;background:#24554b;border:0;border-radius:5px;font:600 11px 'DM Sans',sans-serif;cursor:pointer}.primary-action:disabled{opacity:.6}.primary-action mat-icon{width:17px;height:17px;font-size:17px}.feedback{margin:0 0 12px;padding:10px 12px;border-radius:5px;font-size:11px}.feedback.success{color:#286346;background:#edf6ef}.feedback.error{color:#9d4c38;background:#fbefeb}@media(max-width:600px){.settings-section{padding:16px}.form-grid{grid-template-columns:1fr;padding-left:0}.form-grid .wide{grid-column:auto}.actions{align-items:flex-start;flex-direction:column;padding:14px 16px}}
  `]
})
export class SettingsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly settings = inject(SettingsApiService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = this.fb.group({ profileName: ['', [Validators.required, Validators.maxLength(120)]], profileEmail: ['', [Validators.required, Validators.email, Validators.maxLength(254)]], mobileNumber: ['', Validators.maxLength(20)], plantName: ['', [Validators.required, Validators.maxLength(120)]], plantAddress: ['', Validators.maxLength(250)], plantStatus: ['OPERATIONAL', Validators.required] });

  ngOnInit(): void {
    this.settings.load().subscribe({ next: (response) => { this.form.patchValue(response.data); this.loading.set(false); }, error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not load settings.'); this.loading.set(false); } });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); this.error.set('Enter a valid name, email and plant name.'); return; }
    this.error.set(''); this.message.set(''); this.saving.set(true);
    this.settings.save(this.form.getRawValue() as SettingsUpdate).subscribe({ next: (response) => { this.form.patchValue(response.data); this.message.set(response.message); this.saving.set(false); }, error: (error: HttpErrorResponse) => { this.error.set(error.error?.message ?? 'Could not save settings.'); this.saving.set(false); } });
  }
}
