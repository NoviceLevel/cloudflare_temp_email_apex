import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { StateService } from '../../services/state.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatSlideToggleModule, MatButtonToggleModule],
  template: `
    <div class="appearance-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ t()('appearance') }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="setting-row">
            <span>Dark Mode</span>
            <mat-slide-toggle [checked]="state.isDark()" (change)="state.toggleDark()"></mat-slide-toggle>
          </div>
          <div class="setting-row">
            <span>Language</span>
            <mat-button-toggle-group [value]="state.locale()" (change)="state.setLocale($event.value)">
              <mat-button-toggle value="zh">中文</mat-button-toggle>
              <mat-button-toggle value="en">English</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .appearance-container { max-width: 600px; margin: 0 auto; padding: 16px; }
    .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--mat-sys-outline-variant); }
  `]
})
export class AppearanceComponent {
  state = inject(StateService);
  private i18n = inject(I18nService);
  t = this.i18n.t;
}
