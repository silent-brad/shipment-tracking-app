import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ShipmentService } from '../../core/services/shipment.service';
import { 
  Shipment, 
  ShipmentStatus, 
  SHIPMENT_STATUS_LABELS, 
  SHIPMENT_STATUS_BADGES 
} from '../../core/models/shipment.model';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container py-4">
      <div class="text-center mb-5">
        <h1>Track Your Shipment</h1>
        <p class="text-muted">Enter your tracking number to see real-time updates</p>
      </div>
      
      <!-- Tracking Form -->
      <div class="row justify-content-center mb-5">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <div class="d-flex gap-2">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Enter tracking number"
                  [(ngModel)]="trackingNumber"
                  (keyup.enter)="trackShipment()"
                  [disabled]="loading">
                <button 
                  class="btn btn-primary"
                  (click)="trackShipment()"
                  [disabled]="loading || !trackingNumber">
                  <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
                  Track
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Error State -->
      <div class="row justify-content-center" *ngIf="error">
        <div class="col-md-8">
          <div class="alert alert-danger text-center">
            <strong>Error:</strong> {{ error }}
          </div>
        </div>
      </div>
      
      <!-- Tracking Results -->
      <div class="row justify-content-center" *ngIf="shipment && !loading">
        <div class="col-md-8">
          <!-- Shipment Summary -->
          <div class="card mb-4">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <h5>Tracking: {{ shipment.trackingNumber }}</h5>
                <span class="badge" [ngClass]="getStatusBadgeClass(shipment.status)">
                  {{ getStatusLabel(shipment.status) }}
                </span>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-sm-6">
                  <strong>From:</strong>
                  <p>{{ shipment.origin }}</p>
                </div>
                <div class="col-sm-6">
                  <strong>To:</strong>
                  <p>{{ shipment.destination }}</p>
                </div>
                <div class="col-12" *ngIf="shipment.description">
                  <strong>Description:</strong>
                  <p>{{ shipment.description }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Progress Tracker -->
          <div class="card mb-4">
            <div class="card-header">
              <h5>Delivery Progress</h5>
            </div>
            <div class="card-body">
              <div class="progress-tracker">
                <div class="progress-step" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.CREATED), 'active': shipment.status === ShipmentStatus.CREATED}">
                  <div class="step-icon">📦</div>
                  <div class="step-label">Created</div>
                </div>
                
                <div class="progress-line" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.PICKED_UP)}"></div>
                
                <div class="progress-step" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.PICKED_UP), 'active': shipment.status === ShipmentStatus.PICKED_UP}">
                  <div class="step-icon">🚚</div>
                  <div class="step-label">Picked Up</div>
                </div>
                
                <div class="progress-line" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.IN_TRANSIT)}"></div>
                
                <div class="progress-step" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.IN_TRANSIT), 'active': shipment.status === ShipmentStatus.IN_TRANSIT}">
                  <div class="step-icon">🛣️</div>
                  <div class="step-label">In Transit</div>
                </div>
                
                <div class="progress-line" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.OUT_FOR_DELIVERY)}"></div>
                
                <div class="progress-step" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.OUT_FOR_DELIVERY), 'active': shipment.status === ShipmentStatus.OUT_FOR_DELIVERY}">
                  <div class="step-icon">🚛</div>
                  <div class="step-label">Out for Delivery</div>
                </div>
                
                <div class="progress-line" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.DELIVERED)}"></div>
                
                <div class="progress-step" 
                     [ngClass]="{'completed': isStatusReached(ShipmentStatus.DELIVERED), 'active': shipment.status === ShipmentStatus.DELIVERED}">
                  <div class="step-icon">✅</div>
                  <div class="step-label">Delivered</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Timeline -->
          <div class="card">
            <div class="card-header">
              <h5>Timeline</h5>
            </div>
            <div class="card-body">
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <strong>Created</strong>
                    <p class="text-muted mb-0">{{ shipment.createdAt | date:'medium' }}</p>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <strong>Last Updated</strong>
                    <p class="text-muted mb-0">{{ shipment.updatedAt | date:'medium' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No Results -->
      <div class="row justify-content-center" *ngIf="searched && !shipment && !loading && !error">
        <div class="col-md-6">
          <div class="text-center py-5">
            <div class="mb-3">🔍</div>
            <h3>No shipment found</h3>
            <p class="text-muted">
              We couldn't find a shipment with tracking number "{{ trackingNumber }}"
            </p>
            <button class="btn btn-outline-primary" (click)="clearSearch()">
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .progress-tracker {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 2rem 0;
    }
    
    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    
    .step-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      margin-bottom: 0.5rem;
    }
    
    .step-label {
      font-size: 0.8rem;
      text-align: center;
      font-weight: 600;
      color: var(--text-muted);
    }
    
    .progress-step.completed .step-icon {
      background: var(--success);
      border-color: var(--success);
      color: white;
    }
    
    .progress-step.completed .step-label {
      color: var(--success);
    }
    
    .progress-step.active .step-icon {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      animation: pulse 2s infinite;
    }
    
    .progress-step.active .step-label {
      color: var(--primary);
    }
    
    .progress-line {
      flex: 1;
      height: 2px;
      background: var(--border-color);
      margin: 0 1rem;
      position: relative;
      top: -1.75rem;
    }
    
    .progress-line.completed {
      background: var(--success);
    }
    
    .timeline {
      position: relative;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 1rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--border-color);
    }
    
    .timeline-item {
      position: relative;
      padding-left: 3rem;
      padding-bottom: 1.5rem;
    }
    
    .timeline-marker {
      position: absolute;
      left: 0.5rem;
      top: 0.5rem;
      width: 1rem;
      height: 1rem;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid white;
      box-shadow: 0 0 0 2px var(--primary);
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    @media (max-width: 768px) {
      .progress-tracker {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .progress-line {
        flex: none;
        width: 2px;
        height: 2rem;
        margin: 0.5rem 1.5rem;
        top: 0;
      }
      
      .progress-step {
        align-items: flex-start;
        flex-direction: row;
        width: 100%;
      }
      
      .step-icon {
        margin-right: 1rem;
        margin-bottom: 0;
      }
      
      .step-label {
        align-self: center;
      }
    }
  `]
})
export class TrackingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Make ShipmentStatus enum available to the template
  ShipmentStatus = ShipmentStatus;
  
  trackingNumber = '';
  shipment: Shipment | null = null;
  loading = false;
  error = '';
  searched = false;

  private statusOrder: ShipmentStatus[] = [
    ShipmentStatus.CREATED,
    ShipmentStatus.PICKED_UP,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.OUT_FOR_DELIVERY,
    ShipmentStatus.DELIVERED
  ];

  constructor(
    private shipmentService: ShipmentService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Check if tracking number is provided in URL
    const trackingNumberFromUrl = this.route.snapshot.paramMap.get('trackingNumber');
    if (trackingNumberFromUrl) {
      this.trackingNumber = trackingNumberFromUrl;
      this.trackShipment();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackShipment() {
    if (!this.trackingNumber.trim()) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.shipment = null;
    this.searched = false;

    this.shipmentService.trackShipment(this.trackingNumber.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (shipment: Shipment) => {
          this.shipment = shipment;
          this.loading = false;
          this.searched = true;
        },
        error: (err: any) => {
          if (err.status === 404) {
            this.shipment = null;
          } else {
            this.error = 'Failed to track shipment. Please try again.';
          }
          this.loading = false;
          this.searched = true;
        }
      });
  }

  clearSearch() {
    this.trackingNumber = '';
    this.shipment = null;
    this.error = '';
    this.searched = false;
  }

  isStatusReached(status: ShipmentStatus): boolean {
    if (!this.shipment) return false;
    
    const currentIndex = this.statusOrder.indexOf(this.shipment.status);
    const targetIndex = this.statusOrder.indexOf(status);
    
    return currentIndex >= targetIndex;
  }

  getStatusLabel(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_LABELS[status];
  }

  getStatusBadgeClass(status: ShipmentStatus): string {
    return SHIPMENT_STATUS_BADGES[status];
  }
}
