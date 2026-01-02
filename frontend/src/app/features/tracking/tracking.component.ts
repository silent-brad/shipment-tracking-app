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
  templateUrl: './tracking.component.html',
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
