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
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>All Shipments</h1>
          <p class="text-muted">Manage and track all your shipments</p>
        </div>
        <a routerLink="/create" class="btn btn-primary">
          <i class="material-icons">add</i>
          Create Shipment
        </a>
      </div>
      
      <!-- Filters and Search -->
      <div class="card mb-4">
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <div class="filter-group">
            <label class="form-label text-sm mb-1">Status Filter:</label>
            <select class="form-control form-control-sm" (change)="onFilterChange($event)">
              <option value="">All Statuses</option>
              <option value="CREATED">Created</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="DELAYED">Delayed</option>
              <option value="RETURNED">Returned</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div class="filter-group ms-auto">
            <button class="btn btn-secondary btn-sm" (click)="refreshShipments()">
              <i class="material-icons">refresh</i>
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div class="text-center py-5" *ngIf="loading">
        <div class="spinner"></div>
        <p class="text-muted mt-2">Loading shipments...</p>
      </div>
      
      <!-- Shipments Table -->
      <div class="card" *ngIf="!loading">
        <div class="table-responsive">
          <table class="table table-hover" *ngIf="filteredShipments.length > 0; else noShipments">
            <thead>
              <tr>
                <th>Tracking Number</th>
                <th>Route</th>
                <th>Status</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let shipment of filteredShipments" class="shipment-row">
                <td>
                  <strong>{{ shipment.trackingNumber }}</strong>
                  <div class="text-sm text-muted" *ngIf="shipment.description">
                    {{ shipment.description }}
                  </div>
                </td>
                <td>
                  <div class="route-info">
                    <div class="text-sm">
                      <strong>From:</strong> {{ shipment.origin }}
                    </div>
                    <div class="text-sm text-muted">
                      <strong>To:</strong> {{ shipment.destination }}
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="getStatusBadgeClass(shipment.status)">
                    {{ getStatusLabel(shipment.status) }}
                  </span>
                </td>
                <td class="text-sm">
                  {{ shipment.createdAt | date:'MMM d, y' }}<br>
                  <span class="text-muted">{{ shipment.createdAt | date:'HH:mm' }}</span>
                </td>
                <td class="text-sm">
                  {{ shipment.updatedAt | date:'MMM d, y' }}<br>
                  <span class="text-muted">{{ shipment.updatedAt | date:'HH:mm' }}</span>
                </td>
                <td>
                  <div class="d-flex gap-1">
                    <a [routerLink]="['/shipments', shipment.id]" class="btn btn-primary btn-sm">
                      View
                    </a>
                    <button 
                      class="btn btn-danger btn-sm"
                      *ngIf="!isTerminalStatus(shipment.status)"
                      (click)="deleteShipment(shipment)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <ng-template #noShipments>
          <div class="text-center py-5">
            <div class="mb-3">📦</div>
            <h3>No shipments found</h3>
            <p class="text-muted">
              {{ selectedStatus ? 'No shipments with the selected status' : 'Start by creating your first shipment' }}
            </p>
            <a routerLink="/create" class="btn btn-primary" *ngIf="!selectedStatus">
              Create First Shipment
            </a>
          </div>
        </ng-template>
        
        <!-- Pagination -->
        <div class="card-footer" *ngIf="filteredShipments.length > 0">
          <div class="d-flex justify-content-between align-items-center">
            <span class="text-sm text-muted">
              Showing {{ filteredShipments.length }} of {{ allShipments.length }} shipments
            </span>
            <div class="pagination-info text-sm text-muted">
              Last updated: {{ lastUpdated | date:'MMM d, y HH:mm' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
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
