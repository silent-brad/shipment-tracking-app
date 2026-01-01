import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ShipmentService } from '../../core/services/shipment.service';
import { 
  Shipment, 
  ShipmentStatus, 
  SHIPMENT_STATUS_LABELS, 
  SHIPMENT_STATUS_BADGES 
} from '../../core/models/shipment.model';

interface DashboardStats {
  total: number;
  inTransit: number;
  delivered: number;
  delayed: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="dashboard-header mb-4">
        <h1 class="dashboard-title">Dashboard</h1>
        <p class="text-muted">Track your shipments in real-time</p>
      </div>
      
      <!-- Stats Cards -->
      <div class="row mb-5">
        <div class="col">
          <div class="stat-card card">
            <div class="stat-icon">📦</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.total }}</div>
              <div class="stat-label">Total Shipments</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="stat-card card">
            <div class="stat-icon">🚛</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.inTransit }}</div>
              <div class="stat-label">In Transit</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="stat-card card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.delivered }}</div>
              <div class="stat-label">Delivered</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="stat-card card">
            <div class="stat-icon">⚠️</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.delayed }}</div>
              <div class="stat-label">Delayed</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="row mb-5">
        <div class="col-md-8">
          <div class="card">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h3>Recent Shipments</h3>
              <a routerLink="/shipments" class="btn btn-primary btn-sm">View All</a>
            </div>
            
            <div class="shipment-list" *ngIf="recentShipments.length > 0; else noShipments">
              <div 
                class="shipment-item d-flex justify-content-between align-items-center"
                *ngFor="let shipment of recentShipments"
                (click)="navigateToShipment(shipment.id)">
                <div class="shipment-info">
                  <div class="shipment-route">
                    <strong>{{ shipment.origin }}</strong> → <strong>{{ shipment.destination }}</strong>
                  </div>
                  <div class="shipment-meta text-sm text-muted">
                    {{ shipment.trackingNumber }} • {{ shipment.updatedAt | date:'medium' }}
                  </div>
                </div>
                <div class="shipment-status">
                  <span class="badge" [ngClass]="getStatusBadgeClass(shipment.status)">
                    {{ getStatusLabel(shipment.status) }}
                  </span>
                </div>
              </div>
            </div>
            
            <ng-template #noShipments>
              <div class="text-center text-muted py-4">
                <div class="mb-3">📦</div>
                <p>No shipments yet</p>
                <a routerLink="/create" class="btn btn-primary btn-sm">Create First Shipment</a>
              </div>
            </ng-template>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <h3 class="mb-3">Quick Actions</h3>
            <div class="d-flex flex-column gap-2">
              <a routerLink="/create" class="btn btn-primary">
                <i class="material-icons">add</i>
                Create Shipment
              </a>
              <button class="btn btn-secondary" (click)="refreshData()">
                <i class="material-icons">refresh</i>
                Refresh Data
              </button>
              <a routerLink="/shipments" class="btn btn-secondary">
                <i class="material-icons">list</i>
                View All Shipments
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Overdue Shipments Alert -->
      <div class="alert alert-warning" *ngIf="overdueShipments.length > 0">
        <div class="d-flex align-items-center gap-2">
          <i class="material-icons">warning</i>
          <div>
            <strong>{{ overdueShipments.length }} overdue shipment(s)</strong>
            <p class="mb-0">Some shipments are past their estimated delivery date.</p>
          </div>
          <a routerLink="/shipments" class="btn btn-warning btn-sm ms-auto">View</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-title {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border: none;
      box-shadow: var(--shadow-md);
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
    
    .stat-icon {
      font-size: 2rem;
      opacity: 0.8;
    }
    
    .stat-number {
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-bottom: 0.25rem;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .shipment-item {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover {
        background: var(--bg-secondary);
      }
      
      &:last-child {
        border-bottom: none;
      }
    }
    
    .shipment-route {
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
    
    .shipment-meta {
      font-size: 0.8rem;
    }
    
    .ms-auto {
      margin-left: auto;
    }
    
    @media (max-width: 768px) {
      .stat-card {
        text-align: center;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .stat-number {
        font-size: 1.5rem;
      }
      
      .shipment-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: DashboardStats = {
    total: 0,
    inTransit: 0,
    delivered: 0,
    delayed: 0
  };
  
  recentShipments: Shipment[] = [];
  overdueShipments: Shipment[] = [];
  loading = false;

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit() {
    this.loadDashboardData();
    this.loadOverdueShipments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData() {
    this.loading = true;
    
    this.shipmentService.getAllShipments(0, 50)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.calculateStats(response.content);
          this.recentShipments = response.content.slice(0, 5);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  loadOverdueShipments() {
    this.shipmentService.getOverdueShipments()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipments) => {
          this.overdueShipments = shipments;
        },
        error: (error) => {
          console.error('Error loading overdue shipments:', error);
        }
      });
  }

  calculateStats(shipments: Shipment[]) {
    this.stats = {
      total: shipments.length,
      inTransit: shipments.filter(s => 
        s.status === ShipmentStatus.IN_TRANSIT || 
        s.status === ShipmentStatus.PICKED_UP ||
        s.status === ShipmentStatus.OUT_FOR_DELIVERY
      ).length,
      delivered: shipments.filter(s => s.status === ShipmentStatus.DELIVERED).length,
      delayed: shipments.filter(s => s.status === ShipmentStatus.DELAYED).length
    };
  }

  refreshData() {
    this.loadDashboardData();
    this.loadOverdueShipments();
  }

  navigateToShipment(id: number) {
    // Navigate to shipment detail
    window.location.href = `/shipments/${id}`;
  }

  getStatusLabel(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_LABELS[status];
  }

  getStatusBadgeClass(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_BADGES[status];
  }
}
