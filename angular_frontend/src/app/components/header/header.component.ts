import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { StateService } from '../../services/state.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <a routerLink="/" class="logo">
        <img src="assets/logo.png" alt="Logo" height="32" onerror="this.style.display='none'">
        <span>{{ state.openSettings().title || t()('title') }}</span>
      </a>
      
      <span class="spacer"></span>
      
      <nav class="nav-links">
        <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
          <mat-icon>home</mat-icon>
          {{ t()('home') }}
        </a>
        
        @if (state.showAdminPage()) {
          <a mat-button routerLink="/admin" routerLinkActive="active">
            <mat-icon>admin_panel_settings</mat-icon>
            {{ t()('admin') }}
          </a>
        }
        
        @if (state.openSettings().enableUserCreateEmail) {
          <a mat-button routerLink="/user" routerLinkActive="active">
            <mat-icon>person</mat-icon>
            {{ t()('user') }}
          </a>
        }
        
        @if (state.openSettings().enableIndexAbout) {
          <a mat-button routerLink="/about" routerLinkActive="active">
            <mat-icon>info</mat-icon>
            {{ t()('about') }}
          </a>
        }
      </nav>
      
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>more_vert</mat-icon>
      </button>
      
      <mat-menu #menu="matMenu">
        <button mat-menu-item routerLink="/appearance">
          <mat-icon>palette</mat-icon>
          <span>{{ t()('appearance') }}</span>
        </button>
        <button mat-menu-item (click)="toggleLocale()">
          <mat-icon>language</mat-icon>
          <span>{{ state.locale() === 'zh' ? 'English' : '中文' }}</span>
        </button>
        <button mat-menu-item (click)="state.toggleDark()">
          <mat-icon>{{ state.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          <span>{{ state.isDark() ? 'Light' : 'Dark' }}</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    mat-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: inherit;
      
      img {
        border-radius: 4px;
      }
    }
    
    .spacer {
      flex: 1;
    }
    
    .nav-links {
      display: flex;
      gap: 4px;
      
      a {
        mat-icon {
          margin-right: 4px;
        }
        
        &.active {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
    
    @media (max-width: 600px) {
      .nav-links {
        display: none;
      }
    }
  `]
})
export class HeaderComponent {
  state = inject(StateService);
  private i18n = inject(I18nService);
  
  t = this.i18n.t;
  
  toggleLocale() {
    this.state.setLocale(this.state.locale() === 'zh' ? 'en' : 'zh');
  }
}
