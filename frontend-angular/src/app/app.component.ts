import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HeaderComponent } from './views/header/header.component';
import { FooterComponent } from './views/footer/footer.component';
import { GlobalStateService } from './services/global-state.service';
import { ApiService } from './services/api.service';

const LIGHT_THEME = 'https://unpkg.com/@angular/material@19/prebuilt-themes/azure-blue.css';
const DARK_THEME = 'https://unpkg.com/@angular/material@19/prebuilt-themes/cyan-orange.css';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, MatProgressSpinnerModule],
  template: `
    <div class="app-container">
      @if (state.loading()) {
        <div class="loading-overlay">
          <mat-spinner diameter="50"></mat-spinner>
        </div>
      }
      
      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .main-content {
      flex: 1;
      padding: 16px 0;
    }
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
  `]
})
export class AppComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private document = inject(DOCUMENT);
  private themeLink: HTMLLinkElement | null = null;

  constructor() {
    this.initGlobalStyles();
    this.initThemeLink();
    
    effect(() => {
      const isDark = this.state.isDark();
      if (this.themeLink) {
        this.themeLink.href = isDark ? DARK_THEME : LIGHT_THEME;
      }
      // Google style colors: dark #202124 bg / #e8eaed text
      this.document.body.style.backgroundColor = isDark ? '#202124' : '#fafafa';
      this.document.body.style.color = isDark ? '#e8eaed' : '#212121';
      // Add dark-theme class for component styles
      if (isDark) {
        this.document.body.classList.add('dark-theme');
      } else {
        this.document.body.classList.remove('dark-theme');
      }
    });
  }

  private initGlobalStyles() {
    const style = this.document.createElement('style');
    style.textContent = `
      html, body { height: 100%; margin: 0; font-family: Roboto, "Helvetica Neue", sans-serif; }
      body { transition: background-color 0.3s, color 0.3s; }
      /* Google dark mode overrides */
      body.dark-theme .mat-mdc-card,
      body.dark-theme .mat-mdc-dialog-container,
      body.dark-theme .mat-mdc-menu-panel,
      body.dark-theme .mat-mdc-select-panel,
      body.dark-theme .mat-mdc-autocomplete-panel,
      body.dark-theme .mdc-text-field--filled:not(.mdc-text-field--disabled) {
        background-color: #303134 !important;
      }
      body.dark-theme .mat-toolbar {
        background-color: #202124 !important;
      }
      body.dark-theme .mat-mdc-tab-header {
        background-color: #202124;
      }
    `;
    this.document.head.appendChild(style);
  }

  private initThemeLink() {
    this.themeLink = this.document.createElement('link');
    this.themeLink.rel = 'stylesheet';
    this.themeLink.id = 'material-theme';
    this.document.head.appendChild(this.themeLink);
  }

  async ngOnInit() {
    try {
      await this.api.getUserSettings();
    } catch (error) {
      console.error('getUserSettings error:', error);
    }
  }
}
