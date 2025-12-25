import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { StateService } from '../../services/state.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatSlideToggleModule,
    MatButtonToggleModule, MatSliderModule, MatDividerModule
  ],
  template: `
    <div class="appearance-container">
      <mat-card>
        <mat-card-content>
          <!-- Auto Refresh Interval -->
          <div class="setting-section">
            <div class="setting-label">{{ t()('autoRefreshInterval') }}</div>
            <mat-slider min="30" max="300" step="1" discrete [displayWith]="formatSeconds">
              <input matSliderThumb [ngModel]="state.autoRefreshInterval()"
                     (ngModelChange)="state.setAutoRefreshInterval($event)">
            </mat-slider>
            <span class="slider-value">{{ state.autoRefreshInterval() }}s</span>
          </div>

          <mat-divider></mat-divider>

          <!-- Prefer Show Text Mail -->
          <div class="setting-row">
            <span>{{ t()('preferShowTextMail') }}</span>
            <mat-slide-toggle [checked]="preferShowTextMail()"
                              (change)="setPreferShowTextMail($event.checked)">
            </mat-slide-toggle>
          </div>

          <!-- Use Iframe Show Mail -->
          <div class="setting-row">
            <span>{{ t()('useIframeShowMail') }}</span>
            <mat-slide-toggle [checked]="useIframeShowMail()"
                              (change)="setUseIframeShowMail($event.checked)">
            </mat-slide-toggle>
          </div>

          <!-- Use UTC Date -->
          <div class="setting-row">
            <span>{{ t()('useUTCDate') }}</span>
            <mat-slide-toggle [checked]="useUTCDate()"
                              (change)="setUseUTCDate($event.checked)">
            </mat-slide-toggle>
          </div>

          <mat-divider></mat-divider>

          <!-- Dark Mode -->
          <div class="setting-row">
            <span>{{ t()('darkMode') }}</span>
            <mat-slide-toggle [checked]="state.isDark()"
                              (change)="state.toggleDark()">
            </mat-slide-toggle>
          </div>

          <!-- Language -->
          <div class="setting-row">
            <span>{{ t()('language') }}</span>
            <mat-button-toggle-group [value]="state.locale()"
                                     (change)="state.setLocale($event.value)">
              <mat-button-toggle value="zh">中文</mat-button-toggle>
              <mat-button-toggle value="en">English</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .appearance-container { max-width: 800px; margin: 0 auto; padding: 16px; }
    .setting-section { padding: 16px 0; }
    .setting-label { font-size: 14px; color: var(--mat-sys-on-surface-variant); margin-bottom: 8px; }
    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }
    .setting-row:last-child { border-bottom: none; }
    mat-slider { flex: 1; margin: 0 16px; }
    .slider-value { min-width: 50px; text-align: right; font-weight: 500; }
    mat-divider { margin: 8px 0; }
  `]
})
export class AppearanceComponent {
  state = inject(StateService);
  private i18n = inject(I18nService);
  t = this.i18n.t;

  // Local storage keys for appearance settings
  preferShowTextMail = () => localStorage.getItem('preferShowTextMail') === 'true';
  useIframeShowMail = () => localStorage.getItem('useIframeShowMail') === 'true';
  useUTCDate = () => localStorage.getItem('useUTCDate') === 'true';

  setPreferShowTextMail(value: boolean) {
    localStorage.setItem('preferShowTextMail', String(value));
  }

  setUseIframeShowMail(value: boolean) {
    localStorage.setItem('useIframeShowMail', String(value));
  }

  setUseUTCDate(value: boolean) {
    localStorage.setItem('useUTCDate', String(value));
  }

  formatSeconds(value: number): string {
    return `${value}s`;
  }
}
