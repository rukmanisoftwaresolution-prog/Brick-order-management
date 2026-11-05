import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { SettingsApiService } from './settings-api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  template: `
    <div class="app-frame" [class.nav-open]="menuOpen()">
      <aside class="sidebar">
        <a class="brand" routerLink="/" aria-label="Brickworks home">
          <span class="brand-mark"><mat-icon>grid_view</mat-icon></span>
          <span class="brand-name">brickworks<small>OPERATIONS</small></span>
        </a>
        <div class="workspace-label">WORKSPACE</div>
        <nav class="primary-nav" aria-label="Main navigation">
          <a class="nav-link" routerLink="/" [routerLinkActiveOptions]="{ exact: true }" routerLinkActive="active">
            <mat-icon>space_dashboard</mat-icon><span>Overview</span>
          </a>
          @for (item of navigation; track item.path) {
            <a class="nav-link" [routerLink]="'/' + item.path" routerLinkActive="active">
              <mat-icon>{{ item.icon }}</mat-icon><span>{{ item.label }}</span>
              @if (item.count) { <span class="nav-count">{{ item.count }}</span> }
            </a>
          }
        </nav>
        <div class="sidebar-bottom">
          <div class="plant-status"><span class="status-dot" [class.attention]="settingsApi.value().plantStatus === 'ATTENTION'" [class.offline]="settingsApi.value().plantStatus === 'OFFLINE'"></span><span>{{ settingsApi.value().plantName }} <small>{{ plantStatusLabel() }}</small></span><mat-icon>expand_more</mat-icon></div>
          <a class="profile" routerLink="/settings">
            <span class="avatar">{{ profileInitials() }}</span><span class="profile-copy">{{ settingsApi.value().profileName }}<small>{{ settingsApi.value().role }}</small></span><mat-icon>more_horiz</mat-icon>
          </a>
        </div>
      </aside>
      <main class="main-area">
        <header class="topbar">
          <button class="icon-button menu-button" type="button" title="Toggle navigation" aria-label="Toggle navigation" (click)="toggleMenu()"><mat-icon>menu</mat-icon></button>
          <div class="crumb"><span>Brickworks</span><mat-icon>chevron_right</mat-icon><strong>{{ activeTitle() }}</strong></div>
          <div class="top-actions">
            <span class="today-label">Thursday, 05 November 2026</span>
            <div class="notification-anchor">
              <button class="icon-button notification-button" type="button" title="Notifications" aria-label="Notifications" [attr.aria-expanded]="notificationsOpen()" (click)="toggleNotifications()"><mat-icon>notifications_none</mat-icon><i></i></button>
              @if (notificationsOpen()) {
                <div class="notification-popover" role="dialog" aria-label="Notifications">
                  <strong>Notifications</strong>
                  <p><span class="status-dot"></span> 3 orders are ready for dispatch.</p>
                  <p><span class="status-dot"></span> Payment follow-up due for 2 customers.</p>
                  <a routerLink="/deliveries">Open delivery schedule <mat-icon>arrow_forward</mat-icon></a>
                </div>
              }
            </div>
            <span class="top-avatar">{{ profileInitials() }}</span>
          </div>
        </header>
        <section class="page-content"><router-outlet /></section>
      </main>
      @if (menuOpen()) { <button class="scrim" type="button" aria-label="Close navigation" (click)="toggleMenu()"></button> }
    </div>
  `,
  styles: [`
    :host { display:block; min-height:100vh; }
    .app-frame { --forest:#183c36; --forest-2:#24554b; --ink:#1f2925; --muted:#75817b; --line:#e6e9e5; --paper:#f6f7f4; min-height:100vh; color:var(--ink); background:var(--paper); }
    .sidebar { position:fixed; z-index:20; inset:0 auto 0 0; width:246px; display:flex; flex-direction:column; overflow-y:auto; overscroll-behavior:contain; padding:24px 16px 14px; color:#e7f0eb; background:var(--forest); scrollbar-color:#526b61 transparent; scrollbar-width:thin; }
    .brand { display:flex; align-items:center; gap:11px; margin:0 10px 41px; color:inherit; text-decoration:none; }
    .brand-mark { width:35px; height:35px; display:grid; place-items:center; color:#183c36; background:#e9a45b; border-radius:9px; }
    .brand-mark mat-icon { font-size:21px; width:21px; height:21px; }
    .brand-name { font:800 17px/1 Manrope,sans-serif; letter-spacing:0; }
    .brand-name small { display:block; padding-top:6px; color:#9cb7aa; font:600 9px/1 'DM Sans',sans-serif; letter-spacing:1.55px; }
    .workspace-label { margin:0 12px 11px; color:#8ca99a; font-size:10px; font-weight:700; letter-spacing:1.2px; }
    .primary-nav { display:grid; gap:4px; }
    .nav-link { position:relative; min-height:42px; display:flex; align-items:center; gap:12px; padding:0 12px; color:#bfd0c6; border-radius:6px; text-decoration:none; font-size:13px; font-weight:500; transition:background .16s ease,color .16s ease; }
    .nav-link mat-icon { width:19px; height:19px; font-size:19px; color:#9fb5a9; }
    .nav-link:hover { color:#fff; background:#ffffff12; }
    .nav-link.active { color:#fff; background:#ffffff18; }
    .nav-link.active::before { position:absolute; top:10px; bottom:10px; left:-16px; width:3px; content:''; background:#e9a45b; border-radius:0 3px 3px 0; }
    .nav-link.active mat-icon { color:#f0b879; }
    .nav-count { margin-left:auto; min-width:20px; padding:2px 6px; color:#f5cf9f; background:#ffffff17; border-radius:4px; text-align:center; font-size:10px; }
    .sidebar-bottom { margin-top:auto; }
    .plant-status { display:flex; align-items:center; gap:10px; margin:0 3px 13px; padding:12px 10px; border:1px solid #ffffff20; border-radius:7px; color:#e4ede7; font-size:11px; }
    .plant-status small,.profile-copy small { display:block; margin-top:4px; color:#9bb2a5; font-size:10px; }
    .plant-status > mat-icon { margin-left:auto; color:#91a99c; font-size:18px; }
    .status-dot { width:7px; height:7px; border-radius:50%; background:#7ccd9d; box-shadow:0 0 0 3px #7ccd9d20; }
    .status-dot.attention { background:#e9a45b; box-shadow:0 0 0 3px #e9a45b20; }
    .status-dot.offline { background:#d86d45; box-shadow:0 0 0 3px #d86d4520; }
    .profile { display:flex; align-items:center; gap:9px; padding:12px 5px 5px; border-top:1px solid #ffffff20; color:inherit; text-decoration:none; }
    .avatar,.top-avatar { display:grid; place-items:center; width:31px; height:31px; color:#28473e; background:#d5e0d9; border-radius:50%; font-size:10px; font-weight:700; }
    .profile-copy { color:#ecf2ee; font-size:11px; font-weight:600; }
    .profile > mat-icon { margin-left:auto; color:#9bb2a5; }
    .main-area { min-height:100vh; margin-left:246px; }
    .topbar { height:64px; display:flex; align-items:center; justify-content:space-between; padding:0 36px; border-bottom:1px solid var(--line); background:#fff; }
    .crumb,.top-actions { display:flex; align-items:center; gap:10px; }
    .crumb { color:#88928d; font-size:12px; }
    .crumb mat-icon { width:16px; height:16px; font-size:16px; }
    .crumb strong { color:#26352e; font-weight:600; }
    .top-actions { gap:17px; }
    .today-label { color:#78847d; font-size:11px; }
    .icon-button { position:relative; display:grid; place-items:center; width:34px; height:34px; padding:0; border:0; color:#64726a; background:transparent; border-radius:6px; cursor:pointer; }
    .icon-button:hover { background:#f0f3f0; }
    .notification-button i { position:absolute; top:6px; right:6px; width:6px; height:6px; background:#d86d45; border:1px solid white; border-radius:50%; }
    .notification-anchor { position:relative; }
    .notification-popover { position:absolute; z-index:30; top:42px; right:0; width:min(300px,calc(100vw - 32px)); padding:14px; color:#35443c; background:#fff; border:1px solid var(--line); border-radius:6px; box-shadow:0 12px 30px #15251f1c; }
    .notification-popover > strong { display:block; margin-bottom:10px; font-size:12px; }
    .notification-popover p { display:flex; align-items:center; gap:8px; margin:9px 0; color:#69766f; font-size:10px; }
    .notification-popover .status-dot { flex:none; }
    .notification-popover a { display:flex; align-items:center; gap:5px; margin-top:12px; color:#34715c; font-size:10px; font-weight:600; text-decoration:none; }
    .notification-popover a mat-icon { width:14px; height:14px; font-size:14px; }
    .top-avatar { width:29px; height:29px; background:#e9d4bc; }
    .menu-button { display:none; }
    .page-content { max-width:1500px; margin:auto; padding:28px 36px 46px; }
    .scrim { display:none; }
    @media (max-width: 900px) { .sidebar { transform:translateX(-100%); transition:transform .2s ease; } .nav-open .sidebar { transform:translateX(0); } .main-area { margin-left:0; } .menu-button { display:grid; } .topbar { justify-content:flex-start; gap:12px; padding:0 20px; } .top-actions { margin-left:auto; } .today-label { display:none; } .page-content { padding:24px 20px 36px; } .scrim { position:fixed; z-index:15; inset:0; display:block; width:100%; border:0; background:#15251f66; } }
    @media (max-width: 520px) { .topbar { height:58px; padding:0 14px; } .crumb > span,.crumb > mat-icon { display:none; } .top-actions { gap:10px; } .page-content { padding:20px 14px 30px; } }
  `]
})
export class AppComponent {
  readonly menuOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly activeTitle = signal('Overview');
  readonly settingsApi = inject(SettingsApiService);
  readonly profileInitials = computed(() => this.settingsApi.value().profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join(''));
  readonly plantStatusLabel = computed(() => ({ OPERATIONAL: 'Operational', ATTENTION: 'Attention required', OFFLINE: 'Offline' })[this.settingsApi.value().plantStatus] ?? 'Operational');
  readonly navigation = [
    { path: 'customers', label: 'Customers', icon: 'groups' },
    { path: 'products', label: 'Products', icon: 'widgets' },
    { path: 'orders', label: 'Orders', icon: 'receipt_long', count: '8' },
    { path: 'production', label: 'Production', icon: 'factory' },
    { path: 'inventory', label: 'Inventory', icon: 'inventory_2' },
    { path: 'deliveries', label: 'Deliveries', icon: 'local_shipping' },
    { path: 'payments', label: 'Payments', icon: 'payments' },
    { path: 'invoices', label: 'Invoices', icon: 'description' },
    { path: 'reports', label: 'Reports', icon: 'query_stats' },
    { path: 'settings', label: 'Settings', icon: 'settings' }
  ];

  constructor(router: Router) {
    this.settingsApi.load().subscribe();
    router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => this.updateActiveTitle(event.urlAfterRedirects));
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update((open) => !open);
  }

  private updateActiveTitle(url: string): void {
    const path = url.split(/[?#]/, 1)[0].split('/')[1];
    const item = this.navigation.find((navigationItem) => navigationItem.path === path);
    this.activeTitle.set(item?.label ?? 'Overview');
    this.menuOpen.set(false);
    this.notificationsOpen.set(false);
  }
}
