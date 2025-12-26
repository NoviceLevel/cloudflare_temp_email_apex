import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-admin-user-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatSlideToggleModule,
    MatCheckboxModule, MatChipsModule, MatIconModule, TranslateModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">
            {{ 'save' | translate }}
          </button>
        </mat-card-actions>
        <mat-card-content>
          <mat-slide-toggle [(ngModel)]="userSettings.enable" class="mb-3">
            {{ 'allowUserRegister' | translate }}
          </mat-slide-toggle>

          <div class="setting-row mb-3">
            <mat-checkbox [(ngModel)]="userSettings.enableMailVerify">{{ 'enable' | translate }}</mat-checkbox>
            @if (userSettings.enableMailVerify) {
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>{{ 'verifyMailSender' | translate }}</mat-label>
                <input matInput [(ngModel)]="userSettings.verifyMailSender">
              </mat-form-field>
            }
          </div>
          <p class="hint-text mb-3">{{ 'enableMailVerifyHint' | translate }}</p>

          <div class="setting-row mb-3">
            <mat-checkbox [(ngModel)]="userSettings.enableMailAllowList">{{ 'enable' | translate }}</mat-checkbox>
            @if (userSettings.enableMailAllowList) {
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>{{ 'mailAllowList' | translate }}</mat-label>
                <mat-chip-grid #chipGrid>
                  @for (item of userSettings.mailAllowList; track item) {
                    <mat-chip-row (removed)="removeAllowItem(item)">
                      {{item}}
                      <button matChipRemove><mat-icon>cancel</mat-icon></button>
                    </mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                       (matChipInputTokenEnd)="addAllowItem($event)">
              </mat-form-field>
            }
          </div>
          <p class="hint-text mb-3">{{ 'mailAllowListHint' | translate }}</p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'maxBindAddressCount' | translate }}</mat-label>
            <input matInput type="number" [(ngModel)]="userSettings.maxAddressCount">
          </mat-form-field>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 600px; width: 100%; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
    .setting-row { display: flex; align-items: center; gap: 8px; }
    .flex-grow { flex: 1; }
    .hint-text { color: #666; font-size: 12px; margin-top: -8px; }
  `]
})
export class AdminUserSettingsComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  separatorKeyCodes = [ENTER, COMMA];
  userSettings = {
    enable: false,
    enableMailVerify: false,
    verifyMailSender: '',
    enableMailAllowList: false,
    mailAllowList: ['gmail.com', '163.com', '126.com', 'qq.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'yahoo.com', 'foxmail.com'],
    maxAddressCount: 5
  };

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/user_settings');
      Object.assign(this.userSettings, res);
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('fetchSettingsFailed'));
    }
  }

  addAllowItem(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) this.userSettings.mailAllowList.push(value);
    event.chipInput!.clear();
  }

  removeAllowItem(item: string) {
    const index = this.userSettings.mailAllowList.indexOf(item);
    if (index >= 0) this.userSettings.mailAllowList.splice(index, 1);
  }

  async save() {
    try {
      await this.api.fetch('/admin/user_settings', {
        method: 'POST',
        body: this.userSettings
      });
      this.snackbar.success(this.translate.instant('successTip'));
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('saveFailed'));
    }
  }
}
