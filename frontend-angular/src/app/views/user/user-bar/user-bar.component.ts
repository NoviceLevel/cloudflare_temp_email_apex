import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { UserLoginComponent } from '../user-login/user-login.component';

@Component({
  selector: 'app-user-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslateModule,
    UserLoginComponent,
  ],
  template: `
    <div>
      @if (!state.userSettings().fetched) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <div class="skeleton-loader"></div>
          </mat-card-content>
        </mat-card>
      } @else if (state.userSettings().user_email) {
        <div class="alert-success text-center my-3">
          <strong>{{ 'currentUser' | translate }}: {{ state.userSettings().user_email }}</strong>
        </div>
      } @else {
        <div class="login-container">
          <mat-card appearance="outlined" class="login-card">
            <mat-card-content>
              @if (state.userJwt()) {
                <div class="alert-warning mb-4">
                  {{ 'fetchUserSettingsError' | translate }}
                </div>
              }
              <app-user-login></app-user-login>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .skeleton-loader {
      height: 50vh;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    :host-context(.dark-theme) .skeleton-loader {
      background: linear-gradient(90deg, #424242 25%, #616161 50%, #424242 75%);
      background-size: 200% 100%;
    }
    .login-container {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }
    .login-card {
      max-width: 600px;
      width: 100%;
    }
    .text-center {
      text-align: center;
    }
    .my-3 {
      margin: 12px 0;
    }
    .mb-4 {
      margin-bottom: 16px;
    }
    .alert-success {
      padding: 12px;
      background: #e8f5e9;
      border-radius: 4px;
      color: #2e7d32;
    }
    .alert-warning {
      padding: 12px;
      background: #fff3e0;
      border-radius: 4px;
      color: #e65100;
    }
    :host-context(.dark-theme) .alert-success {
      background: #1b5e20;
      color: #a5d6a7;
    }
    :host-context(.dark-theme) .alert-warning {
      background: #4a3000;
      color: #ffb74d;
    }
  `]
})
export class UserBarComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  async ngOnInit() {
    await this.api.getUserOpenSettings();
    if (!this.state.userSettings().user_id) {
      await this.api.getUserSettings();
    }
  }
}
