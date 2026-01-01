import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button class="btn btn-secondary me-2" (click)="goBack()">
            <i class="material-icons">arrow_back</i>
            Back
          </button>
          <h1 *ngIf="shipment">Shipment Details</h1>
        </div>
        <div *ngIf="shipment && !isTerminalStatus(shipment.status)">
          <button class="btn btn-outline-danger" (click)="deleteShipment()">
            <i class="material-icons">delete</i>
            Delete
          </button>
        </div>
      </div>
      
      <!-- Loading State -->
      <div class="text-center py-5" *ngIf="loading">
        <div class="spinner"></div>
        <p class="text-muted mt-2">Loading shipment...</p>
      </div>
      
      <!-- Error State -->
      <div class="alert alert-danger" *ngIf="error">
        <strong>Error:</strong> {{ error }}
      </div>
      
      <!-- Shipment Details -->
      <div *ngIf="shipment && !loading">
        <div class="row">
          <div class="col-md-8">
            <!-- Basic Information -->
            <div class="card mb-4">
              <div class="card-header">
                <h5>Basic Information</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-sm-6">
                    <strong>Tracking Number:</strong>
                    <p class="mb-2">{{ shipment.trackingNumber }}</p>
                  </div>
                  <div class="col-sm-6">
                    <strong>Status:</strong>
                    <p>
                      <span class="badge" [ngClass]="getStatusBadgeClass(shipment.status)">
                        {{ getStatusLabel(shipment.status) }}
                      </span>
                    </p>
                  </div>
                  <div class="col-12" *ngIf="shipment.description">
                    <strong>Description:</strong>
                    <p>{{ shipment.description }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Route Information -->
            <div class="card mb-4">
              <div class="card-header">
                <h5>Route Information</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-sm-6">
                    <strong>Origin:</strong>
                    <p>{{ shipment.origin }}</p>
                  </div>
                  <div class="col-sm-6">
                    <strong>Destination:</strong>
                    <p>{{ shipment.destination }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Timestamps -->
            <div class="card">
              <div class="card-header">
                <h5>Timeline</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-sm-6">
                    <strong>Created:</strong>
                    <p>{{ shipment.createdAt | date:'medium' }}</p>
                  </div>
                  <div class="col-sm-6">
                    <strong>Last Updated:</strong>
                    <p>{{ shipment.updatedAt | date:'medium' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-4">
            <!-- Quick Actions -->
            <div class="card mb-4">
              <div class="card-header">
                <h5>Quick Actions</h5>
              </div>
              <div class="card-body">
                <div class="d-grid gap-2">
                  <a [routerLink]="['/track', shipment.trackingNumber]" class="btn btn-primary">
                    <i class="material-icons">track_changes</i>
                    Track Shipment
                  </a>
                  <button class="btn btn-outline-secondary" (click)="refreshShipment()">
                    <i class="material-icons">refresh</i>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Status Updates -->
            <div class="card" *ngIf="!isTerminalStatus(shipment.status)">
              <div class="card-header">
                <h5>Update Status</h5>
              </div>
              <div class="card-body">
                <div class="d-grid gap-2">
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    *ngIf="shipment.status === ShipmentStatus.CREATED"
                    (click)="updateStatus(ShipmentStatus.PICKED_UP)">
                    Mark as Picked Up
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    *ngIf="shipment.status === ShipmentStatus.PICKED_UP"
                    (click)="updateStatus(ShipmentStatus.IN_TRANSIT)">
                    Mark as In Transit
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    *ngIf="shipment.status === ShipmentStatus.IN_TRANSIT"
                    (click)="updateStatus(ShipmentStatus.OUT_FOR_DELIVERY)">
                    Out for Delivery
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-success"
                    *ngIf="shipment.status === ShipmentStatus.OUT_FOR_DELIVERY"
                    (click)="updateStatus(ShipmentStatus.DELIVERED)">
                    Mark as Delivered
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-header {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }
    
    .card-header h5 {
      margin: 0;
      font-weight: 600;
    }
    
    .btn .material-icons {
      font-size: 1rem;
      margin-right: 0.5rem;
    }
    
    .alert {
      border-radius: 8px;
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 1rem;
      }
      
      .d-flex .btn {
        margin-bottom: 0.5rem;
      }
    }
  `]
})
export class ShipmentDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Make ShipmentStatus enum available to the template
  ShipmentStatus = ShipmentStatus;
  
  shipment: Shipment | null = null;
  loading = false;
  error = '';

  constructor(
    private shipmentService: ShipmentService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadShipment();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadShipment() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No shipment ID provided';
      return;
    }

    this.loading = true;
    this.error = '';
    
    this.shipmentService.getShipmentById(parseInt(id, 10))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment: Shipment) => {
          this.shipment = shipment;
          this.loading = false;
        },
        error: (err: any) => {
          this.error = 'Failed to load shipment details';
          this.loading = false;
        }
      });
  }

  refreshShipment() {
    this.loadShipment();
  }

  updateStatus(newStatus: ShipmentStatus) {
    if (!this.shipment) return;

    this.shipmentService.updateShipmentStatus(this.shipment.id, { status: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedShipment: Shipment) => {
          this.shipment = updatedShipment;
        },
        error: () => {
          this.error = 'Failed to update shipment status';
        }
      });
  }

  deleteShipment() {
    if (!this.shipment) return;

    if (confirm(`Are you sure you want to delete shipment ${this.shipment.trackingNumber}?`)) {
      this.shipmentService.deleteShipment(this.shipment.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/shipments']);
          },
          error: () => {
            this.error = 'Failed to delete shipment';
          }
        });
    }
  }

  goBack() {
    this.router.navigate(['/shipments']);
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
