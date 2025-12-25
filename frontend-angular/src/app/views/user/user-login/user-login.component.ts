import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { hashPassword } from '../../../utils';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatDividerModule, MatDialogModule
  ],
  template: `
    @if (state.userOpenSettings().fetched) {
      <div class="user-login-container">
        <mat-tab-group [(selectedIndex)]="selectedTab" color="primary" animationDuration="0ms">
          <mat-tab label="登录"></mat-tab>
          @if (state.userOpenSettings().enable) {
            <mat-tab label="注册"></mat-tab>
          }
        </mat-tab-group>

        <div class="tab-content">
          @if (selectedTab === 0) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>邮箱</mat-label>
              <input matInput [(ngModel)]="user.email" type="email">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>密码</mat-label>
              <input matInput [(ngModel)]="user.password" type="password">
            </mat-form-field>
            <button mat-stroked-button color="primary" class="full-width mb-2" (click)="emailLogin()">
              <mat-icon>email</mat-icon> 登录
            </button>
            <button mat-button (click)="openForgotPasswordDialog()" class="mb-3">忘记密码</button>
            <mat-divider class="mb-3"></mat-divider>
            <button mat-stroked-button color="primary" class="full-width mb-2" (click)="passkeyLogin()">
              <mat-icon>key</mat-icon> 使用 Passkey 登录
            </button>
            @for (item of state.userOpenSettings().oauth2ClientIDs; track item.clientID) {
              <button mat-stroked-button class="full-width mb-2" (click)="oauth2Login(item.clientID)">
                <mat-icon>{{ item.name.toLowerCase() === 'github' ? 'code' : 'login' }}</mat-icon>
                使用 {{ item.name }} 登录
              </button>
            }
          } @else if (selectedTab === 1) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>邮箱</mat-label>
              <input matInput [(ngModel)]="user.email" type="email">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>密码</mat-label>
              <input matInput [(ngModel)]="user.password" type="password">
            </mat-form-field>
            @if (state.userOpenSettings().enableMailVerify) {
              <div class="verify-code-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>验证码</mat-label>
                  <input matInput [(ngModel)]="user.code">
                </mat-form-field>
                <button mat-stroked-button color="primary" [disabled]="verifyCodeTimeout() > 0" (click)="sendVerificationCode()">
                  {{ verifyCodeTimeout() > 0 ? '等待' + verifyCodeTimeout() + '秒' : '发送验证码' }}
                </button>
              </div>
            }
            <button mat-stroked-button color="primary" class="full-width" (click)="emailSignup()">注册</button>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .user-login-container { max-width: 600px; width: 100%; }
    .tab-content { padding: 16px 0; }
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .verify-code-row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 16px; }
    .flex-1 { flex: 1; }
  `]
})
export class UserLoginComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  selectedTab = 0;
  verifyCodeTimeout = signal(0);
  private verifyCodeExpire = 0;
  user = { email: '', password: '', code: '' };
  cfToken = '';

  async ngOnInit() {
    if (!this.state.userOpenSettings().fetched) {
      await this.api.getUserOpenSettings();
    }
  }

  openForgotPasswordDialog() {
    const dialogRef = this.dialog.open(ForgotPasswordDialogComponent, {
      width: '450px',
      data: { 
        enable: this.state.userOpenSettings().enable,
        enableMailVerify: this.state.userOpenSettings().enableMailVerify,
        cfTurnstileSiteKey: this.state.openSettings().cfTurnstileSiteKey
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedTab = 0;
        this.snackbar.success('密码重置成功，请登录');
      }
    });
  }

  async emailLogin() {
    if (!this.user.email || !this.user.password) {
      this.snackbar.error('请输入邮箱和密码');
      return;
    }
    try {
      const hashedPassword = await hashPassword(this.user.password);
      const res = await this.api.userLogin(this.user.email, hashedPassword);
      this.state.setUserJwt(res.jwt);
      location.reload();
    } catch (error: any) {
      this.snackbar.error(error.message || '登录失败');
    }
  }

  async sendVerificationCode() {
    if (!this.user.email) {
      this.snackbar.error('请输入邮箱');
      return;
    }
    try {
      const res = await this.api.sendVerifyCode(this.user.email, this.cfToken);
      if (res && res.expirationTtl) {
        this.snackbar.success(`验证码已发送, ${res.expirationTtl} 秒后失效`);
        this.verifyCodeExpire = Date.now() + res.expirationTtl * 1000;
        this.startVerifyCodeCountdown();
      }
    } catch (error: any) {
      this.snackbar.error(error.message || '发送验证码失败');
    }
  }

  private startVerifyCodeCountdown() {
    const intervalId = setInterval(() => {
      const remaining = Math.round((this.verifyCodeExpire - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalId);
        this.verifyCodeTimeout.set(0);
      } else {
        this.verifyCodeTimeout.set(remaining);
      }
    }, 1000);
  }

  async emailSignup() {
    if (!this.user.email || !this.user.password) {
      this.snackbar.error('请输入邮箱和密码');
      return;
    }
    if (!this.user.code && this.state.userOpenSettings().enableMailVerify) {
      this.snackbar.error('请输入验证码');
      return;
    }
    try {
      const hashedPassword = await hashPassword(this.user.password);
      await this.api.userRegister(this.user.email, hashedPassword, this.user.code);
      this.selectedTab = 0;
      this.snackbar.success('请登录');
    } catch (error: any) {
      this.snackbar.error(error.message || '注册失败');
    }
  }

  async passkeyLogin() {
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const options = await this.api.passkeyAuthenticateRequest(location.hostname);
      const credential = await startAuthentication(options);
      const res = await this.api.passkeyAuthenticateResponse(location.origin, location.hostname, credential);
      this.state.setUserJwt(res.jwt);
      location.reload();
    } catch (error: any) {
      console.error(error);
      this.snackbar.error(error.message || 'Passkey 登录失败');
    }
  }

  async oauth2Login(clientID: string) {
    try {
      const state = Math.random().toString(36).substring(2);
      this.state.setUserOauth2SessionClientID(clientID);
      this.state.setUserOauth2SessionState(state);
      const res = await this.api.getOauth2LoginUrl(clientID, state);
      location.href = res.url;
    } catch (error: any) {
      this.snackbar.error(error.message || '登录失败');
    }
  }
}

// Forgot Password Dialog
@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>忘记密码</h2>
    <mat-dialog-content>
      @if (data.enable && data.enableMailVerify) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>邮箱</mat-label>
          <input matInput [(ngModel)]="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>新密码</mat-label>
          <input matInput [(ngModel)]="password" type="password">
        </mat-form-field>
        <div class="verify-code-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>验证码</mat-label>
            <input matInput [(ngModel)]="code">
          </mat-form-field>
          <button mat-stroked-button color="primary" [disabled]="verifyCodeTimeout > 0" (click)="sendVerificationCode()">
            {{ verifyCodeTimeout > 0 ? '等待' + verifyCodeTimeout + '秒' : '发送验证码' }}
          </button>
        </div>
      } @else {
        <div class="warning-alert">
          <mat-icon>warning</mat-icon>
          <span>未开启邮箱验证或未开启注册功能，无法重置密码，请联系管理员</span>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      @if (data.enable && data.enableMailVerify) {
        <button mat-raised-button color="primary" (click)="resetPassword()">重置密码</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .verify-code-row { display: flex; gap: 8px; align-items: flex-start; }
    .flex-1 { flex: 1; }
    .warning-alert {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background-color: #fff3e0; border-radius: 4px; color: #e65100;
    }
  `]
})
export class ForgotPasswordDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ForgotPasswordDialogComponent>);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  email = '';
  password = '';
  code = '';
  verifyCodeTimeout = 0;
  private verifyCodeExpire = 0;

  async sendVerificationCode() {
    if (!this.email) {
      this.snackbar.error('请输入邮箱');
      return;
    }
    try {
      const res = await this.api.sendVerifyCode(this.email, '');
      if (res && res.expirationTtl) {
        this.snackbar.success(`验证码已发送, ${res.expirationTtl} 秒后失效`);
        this.verifyCodeExpire = Date.now() + res.expirationTtl * 1000;
        this.startVerifyCodeCountdown();
      }
    } catch (error: any) {
      this.snackbar.error(error.message || '发送验证码失败');
    }
  }

  private startVerifyCodeCountdown() {
    const intervalId = setInterval(() => {
      const remaining = Math.round((this.verifyCodeExpire - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(intervalId);
        this.verifyCodeTimeout = 0;
      } else {
        this.verifyCodeTimeout = remaining;
      }
    }, 1000);
  }

  async resetPassword() {
    if (!this.email || !this.password || !this.code) {
      this.snackbar.error('请填写完整信息');
      return;
    }
    try {
      const hashedPassword = await hashPassword(this.password);
      await this.api.userRegister(this.email, hashedPassword, this.code);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackbar.error(error.message || '重置失败');
    }
  }
}
