import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ShipmentService } from '../../../core/services/shipment.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-shipment-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-lg-8">
          <div class="card">
            <div class="mb-4">
              <h1>Create New Shipment</h1>
              <p class="text-muted">Enter shipment details to start tracking</p>
            </div>
            
            <form [formGroup]="shipmentForm" (ngSubmit)="onSubmit()" class="shipment-form">
              <div class="row">
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Origin *</label>
                    <input 
                      type="text" 
                      class="form-control"
                      [class.is-invalid]="shipmentForm.get('origin')?.invalid && shipmentForm.get('origin')?.touched"
                      formControlName="origin"
                      placeholder="e.g., New York, NY">
                    <div class="invalid-feedback" *ngIf="shipmentForm.get('origin')?.invalid && shipmentForm.get('origin')?.touched">
                      <span *ngIf="shipmentForm.get('origin')?.errors?.['required']">Origin is required</span>
                      <span *ngIf="shipmentForm.get('origin')?.errors?.['minlength']">Origin must be at least 3 characters</span>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="form-group">
                    <label class="form-label">Destination *</label>
                    <input 
                      type="text" 
                      class="form-control"
                      [class.is-invalid]="shipmentForm.get('destination')?.invalid && shipmentForm.get('destination')?.touched"
                      formControlName="destination"
                      placeholder="e.g., Los Angeles, CA">
                    <div class="invalid-feedback" *ngIf="shipmentForm.get('destination')?.invalid && shipmentForm.get('destination')?.touched">
                      <span *ngIf="shipmentForm.get('destination')?.errors?.['required']">Destination is required</span>
                      <span *ngIf="shipmentForm.get('destination')?.errors?.['minlength']">Destination must be at least 3 characters</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea 
                  class="form-control"
                  formControlName="description"
                  rows="3"
                  placeholder="Optional description of the shipment contents"></textarea>
              </div>
              
              <div class="form-group">
                <label class="form-label">Estimated Delivery</label>
                <input 
                  type="datetime-local" 
                  class="form-control"
                  formControlName="estimatedDelivery">
                <div class="form-text">If not specified, delivery will be estimated at 3 days from now</div>
              </div>
              
              <div class="form-actions d-flex gap-3">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  [disabled]="shipmentForm.invalid || loading">
                  <span class="spinner spinner-sm me-2" *ngIf="loading"></span>
                  {{ loading ? 'Creating...' : 'Create Shipment' }}
                </button>
                <button 
                  type="button" 
                  class="btn btn-secondary"
                  (click)="onCancel()">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shipment-form {
      max-width: none;
    }
    
    .form-actions {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border-color);
    }
    
    .form-text {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    
    .me-2 {
      margin-right: 0.5rem;
    }
  `]
})
export class ShipmentCreateComponent implements OnInit {
  shipmentForm!: FormGroup;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private shipmentService: ShipmentService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    
    this.shipmentForm = this.formBuilder.group({
      origin: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      destination: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      estimatedDelivery: [tomorrow.toISOString().slice(0, 16)]
    });
  }

  onSubmit() {
    if (this.shipmentForm.valid) {
      this.loading = true;
      
      const formValue = this.shipmentForm.value;
      const request = {
        origin: formValue.origin,
        destination: formValue.destination,
        description: formValue.description || undefined,
        estimatedDelivery: formValue.estimatedDelivery ? new Date(formValue.estimatedDelivery).toISOString() : undefined
      };
      
      this.shipmentService.createShipment(request).subscribe({
        next: (shipment) => {
          this.loading = false;
          this.notificationService.showSuccess('Shipment created successfully!');
          this.router.navigate(['/shipments', shipment.id]);
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/dashboard']);
  }
}
