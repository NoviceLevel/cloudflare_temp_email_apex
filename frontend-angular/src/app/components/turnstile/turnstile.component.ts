import { Component, inject, OnInit, OnDestroy, signal, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GlobalStateService } from '../../services/global-state.service';

declare global {
  interface Window {
    turnstile: {
      render: (selector: string, options: any) => string;
      remove: (id: string) => void;
    };
  }
}

@Component({
  selector: 'app-turnstile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    @if (state.openSettings().cfTurnstileSiteKey) {
      <div class="turnstile-container">
        @if (loading()) {
          <mat-spinner diameter="40"></mat-spinner>
        } @else {
          <div class="turnstile-wrapper">
            <div id="cf-turnstile"></div>
            <button mat-button color="primary" (click)="refresh()" class="refresh-btn">
              刷新
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .turnstile-container {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }
    .turnstile-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .refresh-btn {
      margin-top: 8px;
    }
  `]
})
export class TurnstileComponent implements OnInit, OnDestroy {
  state = inject(GlobalStateService);
  
  tokenChange = output<string>();
  loading = signal(false);
  
  private turnstileId = '';

  constructor() {
    // Watch for dark mode changes
    effect(() => {
      const isDark = this.state.isDark();
      if (this.state.openSettings().cfTurnstileSiteKey) {
        this.renderTurnstile(true);
      }
    });
  }

  ngOnInit() {
    this.tokenChange.emit('');
    this.renderTurnstile(true);
  }

  ngOnDestroy() {
    if (this.turnstileId && window.turnstile) {
      window.turnstile.remove(this.turnstileId);
    }
  }

  refresh() {
    this.renderTurnstile(true);
  }

  private async renderTurnstile(remove: boolean) {
    const siteKey = this.state.openSettings().cfTurnstileSiteKey;
    if (!siteKey) return;

    this.loading.set(true);
    try {
      // Wait for container
      let container = document.getElementById('cf-turnstile');
      let count = 100;
      while (!container && count-- > 0) {
        container = document.getElementById('cf-turnstile');
        await new Promise(r => setTimeout(r, 10));
      }

      // Wait for turnstile script
      count = 100;
      while (!window.turnstile && count-- > 0) {
        await new Promise(r => setTimeout(r, 10));
      }

      if (!window.turnstile) {
        console.error('Turnstile script not loaded');
        return;
      }

      if (remove && this.turnstileId) {
        window.turnstile.remove(this.turnstileId);
      }

      this.turnstileId = window.turnstile.render('#cf-turnstile', {
        sitekey: siteKey,
        language: 'zh-CN',
        theme: this.state.isDark() ? 'dark' : 'light',
        callback: (token: string) => {
          this.tokenChange.emit(token);
        },
      });
    } finally {
      this.loading.set(false);
    }
  }
}
