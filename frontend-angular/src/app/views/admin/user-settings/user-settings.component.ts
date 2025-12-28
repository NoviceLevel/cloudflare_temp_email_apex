import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

@Component({
  selector: 'app-admin-user-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSlideToggleModule, MatChipsModule, MatIconModule, TranslateModule
  ],
  template: `
    <div class="settings-page">
      <!-- 用户注册设置 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>person_add</mat-icon>
          用户注册
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">允许用户注册</div>
                <div class="setting-desc">开启后，用户可以自行注册账号</div>
              </div>
              <mat-slide-toggle [(ngModel)]="userSettings.enable"></mat-slide-toggle>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">最大绑定地址数</div>
                <div class="setting-desc">每个用户最多可以绑定的邮箱地址数量</div>
              </div>
              <mat-form-field appearance="outline" class="number-input">
                <input matInput type="number" [(ngModel)]="userSettings.maxAddressCount" min="1">
              </mat-form-field>
            </div>
          </div>
        </div>
      </div>

      <!-- 邮箱验证设置 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>verified_user</mat-icon>
          邮箱验证
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">启用邮箱验证</div>
                <div class="setting-desc">注册时需要验证用户邮箱</div>
              </div>
              <mat-slide-toggle [(ngModel)]="userSettings.enableMailVerify"></mat-slide-toggle>
            </div>

            @if (userSettings.enableMailVerify) {
              <div class="form-group mt-3">
                <label class="form-label">验证邮件发送地址</label>
                <mat-form-field appearance="outline" class="full-width">
                  <input matInput [(ngModel)]="userSettings.verifyMailSender" placeholder="noreply@example.com">
                </mat-form-field>
                <div class="form-hint">用于发送验证邮件的地址，需要是已验证的地址</div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- 邮箱白名单 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>checklist</mat-icon>
          邮箱白名单
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">启用邮箱白名单</div>
                <div class="setting-desc">只允许白名单中的邮箱域名注册</div>
              </div>
              <mat-slide-toggle [(ngModel)]="userSettings.enableMailAllowList"></mat-slide-toggle>
            </div>

            @if (userSettings.enableMailAllowList) {
              <div class="form-group mt-3">
                <label class="form-label">允许的邮箱域名</label>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-chip-grid #chipGrid>
                    @for (item of userSettings.mailAllowList; track item) {
                      <mat-chip-row (removed)="removeAllowItem(item)">
                        {{item}}
                        <button matChipRemove><mat-icon>cancel</mat-icon></button>
                      </mat-chip-row>
                    }
                  </mat-chip-grid>
                  <input matInput [matChipInputFor]="chipGrid" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                         (matChipInputTokenEnd)="addAllowItem($event)" placeholder="输入域名后按回车添加">
                </mat-form-field>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="form-actions">
        <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">
          <mat-icon>save</mat-icon>
          保存设置
        </button>
      </div>
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .settings-page { max-width: 800px; }
    .setting-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #e0e0e0; }
    .setting-item:last-child { border-bottom: none; }
    :host-context(.dark) .setting-item { border-color: #3c4043; }
    .setting-info { flex: 1; }
    .setting-title { font-size: 14px; font-weight: 500; color: #202124; }
    :host-context(.dark) .setting-title { color: #e8eaed; }
    .setting-desc { font-size: 12px; color: #5f6368; margin-top: 2px; }
    :host-context(.dark) .setting-desc { color: #9aa0a6; }
    .number-input { width: 100px; }
    .number-input ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
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

  async ngOnInit() { await this.fetchData(); }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/user_settings');
      Object.assign(this.userSettings, res);
    } catch (error: any) {
      this.snackbar.error(error.message || '获取设置失败');
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
      await this.api.fetch('/admin/user_settings', { method: 'POST', body: this.userSettings });
      this.snackbar.success('保存成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '保存失败');
    }
  }
}
