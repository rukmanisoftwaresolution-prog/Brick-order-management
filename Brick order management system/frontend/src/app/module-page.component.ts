import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="module-view">
      <div class="module-header"><div><p class="eyebrow">OPERATIONS / {{ title().toUpperCase() }}</p><h1>{{ title() }}</h1><p class="description">Manage {{ title().toLowerCase() }} across your brick operations.</p></div></div>
      <div class="notice"><mat-icon>construction</mat-icon><div><strong>{{ title() }} workspace</strong><p>This module is scaffolded. Connect its workflows to the API as the business rules and permissions are implemented.</p></div></div>
    </section>
  `,
  styles: [`
    :host { display:block; }.module-view { min-height:65vh; }.module-header { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; }.eyebrow { margin:0 0 9px; color:#829088; font-size:9px; font-weight:700; letter-spacing:1px; }h1 { margin:0; color:#20332a; font:700 26px Manrope,sans-serif; }.description { margin:8px 0 0; color:#7b8680; font-size:12px; }.primary-action { display:flex; align-items:center; gap:7px; min-height:37px; padding:0 13px; border:0; border-radius:5px; color:#fff; background:#24554b; font:600 11px 'DM Sans',sans-serif; cursor:pointer; }.primary-action mat-icon { font-size:17px; }.action-feedback { margin:14px 0 0; color:#785c35; font-size:11px; }.notice { display:flex; align-items:flex-start; gap:13px; margin-top:22px; padding:18px; border:1px solid #ead8b8; border-radius:6px; background:#fcf8f0; color:#785c35; }.notice > mat-icon { color:#bb8a4c; }.notice strong { font-size:12px; }.notice p { margin:6px 0 0; color:#85765f; font-size:11px; line-height:1.5; }
    @media (max-width:560px) { .module-header { align-items:flex-start; flex-direction:column; } h1 { font-size:22px; } }
  `]
})
export class ModulePageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title = computed(() => this.route.snapshot.data['title'] as string ?? 'Workspace');
}
