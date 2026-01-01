import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'shipments',
    loadComponent: () => import('./features/shipments/shipment-list/shipment-list.component').then(m => m.ShipmentListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./features/shipments/shipment-create/shipment-create.component').then(m => m.ShipmentCreateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'shipments/:id',
    loadComponent: () => import('./features/shipments/shipment-detail/shipment-detail.component').then(m => m.ShipmentDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'track/:trackingNumber',
    loadComponent: () => import('./features/tracking/tracking.component').then(m => m.TrackingComponent)
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
