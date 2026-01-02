import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './dashboard.component.html',
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
