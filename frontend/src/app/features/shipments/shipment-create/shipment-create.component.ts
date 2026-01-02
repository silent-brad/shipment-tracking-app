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
  templateUrl: './shipment-create.component.html',
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
