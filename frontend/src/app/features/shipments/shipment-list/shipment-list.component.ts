import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ShipmentService } from '../../../core/services/shipment.service';
import { 
  Shipment, 
  ShipmentStatus, 
  SHIPMENT_STATUS_LABELS, 
  SHIPMENT_STATUS_BADGES 
} from '../../../core/models/shipment.model';

@Component({
  selector: 'app-shipment-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shipment-list.component.html',
  styles: [`
    .filter-group {
      min-width: 150px;
    }
    
    .form-control-sm {
      font-size: 0.8rem;
      padding: 0.375rem 0.5rem;
    }
    
    .shipment-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .route-info {
      min-width: 200px;
    }
    
    .ms-auto {
      margin-left: auto;
    }
    
    .table th {
      font-weight: 600;
      background: var(--bg-secondary);
    }
    
    .table td {
      vertical-align: middle;
    }
    
    @media (max-width: 768px) {
      .table-responsive {
        font-size: 0.8rem;
      }
      
      .btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
      }
      
      .route-info {
        min-width: auto;
      }
    }
  `]
})
export class ShipmentListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  allShipments: Shipment[] = [];
  filteredShipments: Shipment[] = [];
  loading = false;
  selectedStatus = '';
  lastUpdated = new Date();

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit() {
    this.loadShipments();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadShipments() {
    this.loading = true;
    
    this.shipmentService.getAllShipments(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allShipments = response.content;
          this.applyFilter();
          this.lastUpdated = new Date();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedStatus = target.value;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedStatus) {
      this.filteredShipments = this.allShipments.filter(
        shipment => shipment.status === this.selectedStatus
      );
    } else {
      this.filteredShipments = [...this.allShipments];
    }
  }

  refreshShipments() {
    this.loadShipments();
  }

  deleteShipment(shipment: Shipment) {
    if (confirm(`Are you sure you want to delete shipment ${shipment.trackingNumber}?`)) {
      this.shipmentService.deleteShipment(shipment.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadShipments();
          }
        });
    }
  }

  isTerminalStatus(status: ShipmentStatus): boolean {
    return status === ShipmentStatus.DELIVERED || 
           status === ShipmentStatus.RETURNED || 
           status === ShipmentStatus.CANCELLED;
  }

  getStatusLabel(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_LABELS[status];
  }

  getStatusBadgeClass(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_BADGES[status];
  }
}
