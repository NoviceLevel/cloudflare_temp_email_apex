import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import { GlobalStateService } from '../../services/global-state.service';
import { AddressBarComponent } from '../../components/address-bar/address-bar.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    AddressBarComponent,
  ],
  template: `
    <div class="settings-container">
      <h2>{{ 'settings' | translate }}</h2>

      <!-- Email Address Section -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>email</mat-icon>
          <mat-card-title>{{ 'emailAddress' | translate }}</mat-card-title>
          <mat-card-subtitle>{{ 'manageYourEmailAddress' | translate }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <app-address-bar></app-address-bar>
        </mat-card-content>
      </mat-card>

      <!-- Appearance Section -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>palette</mat-icon>
          <mat-card-title>{{ 'appearance' | translate }}</mat-card-title>
          <mat-card-subtitle>{{ 'customizeAppearance' | translate }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">{{ 'darkMode' | translate }}</span>
              <span class="setting-desc">{{ 'darkModeDesc' | translate }}</span>
            </div>
            <mat-slide-toggle 
              [checked]="state.isDark()" 
              (change)="state.toggleDark()">
            </mat-slide-toggle>
          </div>

          <mat-divider></mat-divider>

          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-label">{{ 'autoRefresh' | translate }}</span>
              <span class="setting-desc">{{ 'autoRefreshDesc' | translate }}</span>
            </div>
            <mat-slide-toggle 
              [checked]="state.autoRefresh()" 
              (change)="state.savePreference('autoRefresh', $event.checked)">
            </mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- About Section -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>info</mat-icon>
          <mat-card-title>{{ 'about' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="about-info">
            <p>TempMail - {{ 'tempMailDesc' | translate }}</p>
            <p class="version">Version 1.2.0</p>
            @if (state.openSettings().showGithub) {
              <a href="https://github.com/NoviceLevel/cloudflare_temp_email_apex" target="_blank" class="github-link">
                <mat-icon>code</mat-icon>
                GitHub
              </a>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
    .settings-container h2 {
      font-weight: 400;
      margin-bottom: 24px;
    }

    .settings-card {
      margin-bottom: 16px;
    }
    .settings-card mat-card-header {
      margin-bottom: 16px;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
    }
    .setting-info {
      display: flex;
      flex-direction: column;
    }
    .setting-label {
      font-weight: 500;
    }
    .setting-desc {
      font-size: 12px;
      color: #5f6368;
      margin-top: 4px;
    }
    :host-context(.dark-mode) .setting-desc {
      color: #9aa0a6;
    }

    .about-info {
      padding: 8px 0;
    }
    .about-info p {
      margin: 8px 0;
    }
    .version {
      color: #5f6368;
      font-size: 14px;
    }
    .github-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #1a73e8;
      text-decoration: none;
      margin-top: 8px;
    }
    .github-link:hover {
      text-decoration: underline;
    }
  `]
})
export class SettingsComponent {
  state = inject(GlobalStateService);
}
