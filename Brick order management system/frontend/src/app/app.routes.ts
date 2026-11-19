import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then((module) => module.DashboardComponent),
    data: { breadcrumb: 'Overview' }
  },
  {
    path: 'customers',
    loadComponent: () => import('./customer-page.component').then((module) => module.CustomerPageComponent),
    data: { breadcrumb: 'Customers', title: 'Customers' }
  },
  {
    path: 'products',
    loadComponent: () => import('./product-page.component').then((module) => module.ProductPageComponent),
    data: { breadcrumb: 'Products', title: 'Products' }
  },
  {
    path: 'orders',
    loadComponent: () => import('./order-page.component').then((module) => module.OrderPageComponent),
    data: { breadcrumb: 'Orders', title: 'Orders' }
  },
  {
    path: 'production',
    loadComponent: () => import('./production-page.component').then((module) => module.ProductionPageComponent),
    data: { breadcrumb: 'Production', title: 'Production' }
  },
  {
    path: 'inventory',
    loadComponent: () => import('./inventory-page.component').then((module) => module.InventoryPageComponent),
    data: { breadcrumb: 'Inventory', title: 'Inventory' }
  },
  {
    path: 'deliveries',
    loadComponent: () => import('./delivery-page.component').then((module) => module.DeliveryPageComponent),
    data: { breadcrumb: 'Deliveries', title: 'Deliveries' }
  },
  {
    path: 'payments',
    loadComponent: () => import('./payment-page.component').then((module) => module.PaymentPageComponent),
    data: { breadcrumb: 'Payments', title: 'Payments' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings-page.component').then((module) => module.SettingsPageComponent),
    data: { breadcrumb: 'Settings', title: 'Settings' }
  },
  {
    path: 'invoices',
    loadComponent: () => import('./invoice-page.component').then((module) => module.InvoicePageComponent),
    data: { breadcrumb: 'Invoices', title: 'Invoices' }
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports-page.component').then((module) => module.ReportsPageComponent),
    data: { breadcrumb: 'Reports', title: 'Reports' }
  },
  {
    path: 'login',
    loadComponent: () => import('./module-page.component').then((module) => module.ModulePageComponent),
    data: { breadcrumb: 'Sign in', title: 'Sign in' }
  },
  { path: '**', redirectTo: '' }
];
