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
  templateUrl: './shipment-detail.component.html',
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
