import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './app.component.html',
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .app-header {
      background: var(--bg-color);
      border-bottom: 1px solid var(--border-color);
      padding: 1rem 0;
      box-shadow: var(--shadow-sm);
    }
    
    .app-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary-color);
    }
    
    .nav-link {
      text-decoration: none;
      color: var(--text-secondary);
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
      
      &:hover {
        color: var(--primary-color);
        background: var(--bg-secondary);
      }
      
      &.active {
        color: var(--primary-color);
        background: var(--bg-secondary);
      }
    }
    
    .app-main {
      flex: 1;
      
      &.no-header {
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-secondary);
      }
    }
    
    .app-footer {
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      padding: 1rem 0;
      margin-top: 2rem;
    }
    
    @media (max-width: 768px) {
      .nav-links {
        display: none !important;
      }
      
      .app-title {
        font-size: 1.25rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  isAuthenticated = false;
  currentUser = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe(
      isAuth => this.isAuthenticated = isAuth
    );
    
    this.authService.currentUser$.subscribe(
      user => this.currentUser = user || ''
    );
  }

  logout() {
    this.authService.logout();
  }
}
