import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

interface WebhookSettings {
  enableAllowList: boolean;
  allowList: string[];
}

@Component({
  selector: 'app-admin-webhook-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    <div class="center">
      @if (webhookEnabled()) {
        <mat-card appearance="outlined" class="settings-card">
          <mat-card-actions align="end">
            <button mat-raised-button color="primary" (click)="saveSettings()">
              {{ 'save' | translate }}
            </button>
          </mat-card-actions>
          <mat-card-content>
            <mat-slide-toggle [(ngModel)]="webhookSettings.enableAllowList" color="primary" class="mb-4">
              {{ 'enableAllowList' | translate }}
            </mat-slide-toggle>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'webhookAllowList' | translate }}</mat-label>
              <mat-chip-grid #chipGrid>
                @for (item of webhookSettings.allowList; track item) {
                  <mat-chip-row (removed)="removeFromAllowList(item)">
                    {{ item }}
                    <button matChipRemove>
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                }
              </mat-chip-grid>
              <input matInput
                     [matChipInputFor]="chipGrid"
                     [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                     (matChipInputTokenEnd)="addToAllowList($event)">
            </mat-form-field>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="empty-state">
          <mat-icon class="empty-icon">error_outline</mat-icon>
          <h3>{{ 'notEnabled' | translate }}</h3>
          <p class="error-info">{{ errorInfo() }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .center {
      display: flex;
      justify-content: center;
    }
    .settings-card {
      max-width: 800px;
      width: 100%;
    }
    .full-width {
      width: 100%;
    }
    .mb-4 {
      margin-bottom: 16px;
      display: block;
    }
    .empty-state {
      text-align: center;
      padding: 48px;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #9e9e9e;
    }
    .error-info {
      color: #f44336;
    }
  `]
})
export class AdminWebhookSettingsComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  webhookSettings: WebhookSettings = {
    enableAllowList: false,
    allowList: []
  };
  webhookEnabled = signal(false);
  errorInfo = signal('');

  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  async ngOnInit() {
    await this.getSettings();
  }

  async getSettings() {
    try {
      const res = await this.api.fetch<WebhookSettings>('/admin/webhook/settings');
      Object.assign(this.webhookSettings, res);
      this.webhookEnabled.set(true);
    } catch (error: any) {
      this.errorInfo.set(error.message || 'error');
    }
  }

  async saveSettings() {
    try {
      await this.api.fetch('/admin/webhook/settings', {
        method: 'POST',
        body: JSON.stringify(this.webhookSettings)
      });
      this.snackbar.success(this.translate.instant('successTip'));
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  addToAllowList(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) {
      this.webhookSettings.allowList.push(value);
    }
    event.chipInput!.clear();
  }

  removeFromAllowList(item: string) {
    const index = this.webhookSettings.allowList.indexOf(item);
    if (index >= 0) {
      this.webhookSettings.allowList.splice(index, 1);
    }
  }
}
