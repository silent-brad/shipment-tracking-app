import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card card fade-in">
        <div class="text-center mb-4">
          <h1 class="login-title">📦</h1>
          <h2>Mini Delivery Tracker</h2>
          <p class="text-muted">Sign in to track your shipments</p>
        </div>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input 
              type="text" 
              class="form-control"
              [class.is-invalid]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched"
              formControlName="username"
              placeholder="Enter your username"
              autocomplete="username">
            <div class="invalid-feedback" *ngIf="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              Username is required
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input 
              type="password" 
              class="form-control"
              [class.is-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              formControlName="password"
              placeholder="Enter your password"
              autocomplete="current-password">
            <div class="invalid-feedback" *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              Password is required
            </div>
          </div>
          
          <div class="alert alert-danger" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary w-100"
            [disabled]="loginForm.invalid || loading">
            <span class="spinner spinner-sm me-2" *ngIf="loading"></span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
        
        <div class="login-help mt-4">
          <div class="card" style="background: var(--bg-secondary);">
            <h6>Demo Credentials:</h6>
            <p class="text-sm mb-1"><strong>Admin:</strong> admin / admin123</p>
            <p class="text-sm mb-0"><strong>User:</strong> user / user123</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
      padding: 1rem;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    }
    
    .login-title {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    
    .w-100 {
      width: 100%;
    }
    
    .me-2 {
      margin-right: 0.5rem;
    }
    
    @media (max-width: 480px) {
      .login-container {
        padding: 0.5rem;
      }
      
      .login-card {
        padding: 1rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.initForm();
    
    // Check if already authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private initForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      
      const { username, password } = this.loginForm.value;
      
      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.accessToken && !response.error) {
            this.notificationService.showSuccess('Successfully logged in!');
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = response.error || 'Login failed';
          }
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'An error occurred. Please try again.';
        }
      });
    }
  }
}
