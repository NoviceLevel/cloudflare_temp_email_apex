import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { UserLoginComponent } from '../../views/user/user-login/user-login.component';
import { AddressManagementComponent } from '../../views/user/address-management/address-management.component';
import { UserSettingsComponent } from '../../views/user/user-settings/user-settings.component';
import { UserMailboxComponent } from '../../views/user/user-mailbox/user-mailbox.component';
import { BindAddressComponent } from '../../views/user/bind-address/bind-address.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    UserLoginComponent,
    AddressManagementComponent,
    UserSettingsComponent,
    UserMailboxComponent,
    BindAddressComponent,
  ],
  template: `
    <div class="user-container">
      <div class="user-content">
        <!-- User Bar - 加载中 -->
        @if (!state.userSettings().fetched) {
          <mat-card appearance="outlined">
            <mat-card-content class="loading-content">
              <mat-spinner diameter="40"></mat-spinner>
            </mat-card-content>
          </mat-card>
        } @else if (state.userSettings().user_email) {
          <!-- 已登录 -->
          <div class="user-info-alert">
            <mat-icon>check_circle</mat-icon>
            <strong>当前登录用户: {{ state.userSettings().user_email }}</strong>
          </div>

          <!-- Tabs -->
          <mat-tab-group [(selectedIndex)]="selectedTab" color="primary">
            <mat-tab label="地址管理">
              <div class="tab-content">
                <app-address-management></app-address-management>
              </div>
            </mat-tab>
            <mat-tab label="收件箱">
              <div class="tab-content">
                <app-user-mailbox></app-user-mailbox>
              </div>
            </mat-tab>
            <mat-tab label="用户设置">
              <div class="tab-content">
                <app-user-settings></app-user-settings>
              </div>
            </mat-tab>
            <mat-tab label="绑定邮箱地址">
              <div class="tab-content">
                <app-bind-address></app-bind-address>
              </div>
            </mat-tab>
          </mat-tab-group>
        } @else {
          <!-- 未登录 - 显示登录表单 -->
          <div class="login-container">
            <mat-card appearance="outlined">
              <mat-card-content>
                @if (state.userJwt()) {
                  <div class="warning-alert mb-3">
                    <mat-icon>warning</mat-icon>
                    <span>登录信息已过期或账号不存在，也可能是网络连接异常，请稍后再尝试。</span>
                  </div>
                }
                <app-user-login></app-user-login>
              </mat-card-content>
            </mat-card>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .user-container {
      display: flex;
      justify-content: center;
      padding: 24px 16px;
    }
    .user-content {
      max-width: 1200px;
      width: 100%;
    }
    .loading-content {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .user-info-alert {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #e8f5e9;
      border-radius: 4px;
      color: #2e7d32;
      margin-bottom: 16px;
    }
    .login-container {
      display: flex;
      justify-content: center;
      margin: 24px 0;
    }
    .login-container mat-card {
      max-width: 600px;
      width: 100%;
    }
    .warning-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #fff3e0;
      border-radius: 4px;
      color: #e65100;
    }
    .mb-3 {
      margin-bottom: 12px;
    }
    .tab-content {
      padding: 16px;
    }
    :host-context(.dark-theme) .user-info-alert {
      background-color: #1b5e20;
      color: #a5d6a7;
    }
    :host-context(.dark-theme) .warning-alert {
      background-color: #4a3000;
      color: #ffb74d;
    }
  `]
})
export class UserComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  selectedTab = 0;

  async ngOnInit() {
    await this.api.getUserOpenSettings();
    if (!this.state.userSettings().user_id) {
      await this.api.getUserSettings();
    }
  }
}
