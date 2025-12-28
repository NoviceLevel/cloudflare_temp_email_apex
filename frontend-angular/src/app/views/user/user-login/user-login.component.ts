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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { hashPassword } from '../../../utils';

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatDividerModule, MatDialogModule, TranslateModule
  ],
  template: `
    @if (state.userOpenSettings().fetched) {
      <div class="user-login-container">
        <mat-tab-group [(selectedIndex)]="selectedTab" color="primary" animationDuration="0ms">
          <mat-tab [label]="'login' | translate"></mat-tab>
          @if (state.userOpenSettings().enable) {
            <mat-tab [label]="'register' | translate"></mat-tab>
          }
        </mat-tab-group>

        <div class="tab-content">
          @if (selectedTab === 0) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'email' | translate }}</mat-label>
              <input matInput [(ngModel)]="user.email" type="email">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'password' | translate }}</mat-label>
              <input matInput [(ngModel)]="user.password" type="password">
            </mat-form-field>
            <button mat-stroked-button color="primary" class="full-width mb-2" (click)="emailLogin()">
              <mat-icon>email</mat-icon> {{ 'login' | translate }}
            </button>
            <button mat-button (click)="openForgotPasswordDialog()" class="mb-3">{{ 'forgotPassword' | translate }}</button>
            <mat-divider class="mb-3"></mat-divider>
            <button mat-stroked-button color="primary" class="full-width mb-2" (click)="passkeyLogin()">
              <mat-icon>key</mat-icon> {{ 'passkeyLogin' | translate }}
            </button>
            @for (item of state.userOpenSettings().oauth2ClientIDs; track item.clientID) {
              <button mat-stroked-button class="full-width mb-2" (click)="oauth2Login(item.clientID)">
                <mat-icon>{{ item.name.toLowerCase() === 'github' ? 'code' : 'login' }}</mat-icon>
                {{ 'loginWith' | translate }} {{ item.name }}
              </button>
            }
          } @else if (selectedTab === 1) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'email' | translate }}</mat-label>
              <input matInput [(ngModel)]="user.email" type="email">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'password' | translate }}</mat-label>
              <input matInput [(ngModel)]="user.password" type="password">
            </mat-form-field>
            @if (state.userOpenSettings().enableMailVerify) {
              <div class="verify-code-row">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>{{ 'verifyCode' | translate }}</mat-label>
                  <input matInput [(ngModel)]="user.code">
                </mat-form-field>
                <button mat-stroked-button color="primary" [disabled]="verifyCodeTimeout() > 0" (click)="sendVerificationCode()">
                  {{ verifyCodeTimeout() > 0 ? (('waitSeconds' | translate:{seconds: verifyCodeTimeout()})) : ('sendCode' | translate) }}
                </button>
              </div>
            }
            <button mat-stroked-button color="primary" class="full-width" (click)="emailSignup()">{{ 'register' | translate }}</button>
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
  private translate = inject(TranslateService);

  selectedTab = 0;
  verifyCodeTimeout = signal(0);
  private verifyCodeExpire = 0;
  private verifyCodeIntervalId: any = null;
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
        this.snackbar.success(this.translate.instant('resetPasswordSuccess'));
      }
    });
  }

  async emailLogin() {
    if (!this.user.email || !this.user.password) {
      this.snackbar.error(this.translate.instant('pleaseEnterEmailAndPassword'));
      return;
    }
    try {
      const hashedPassword = await hashPassword(this.user.password);
      const res = await this.api.userLogin(this.user.email, hashedPassword);
      this.state.setUserJwt(res.jwt);
      location.reload();
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('loginFailed'));
    }
  }

  async sendVerificationCode() {
    if (!this.user.email) {
      this.snackbar.error(this.translate.instant('pleaseEnterEmail'));
      return;
    }
    try {
      const res = await this.api.sendVerifyCode(this.user.email, this.cfToken);
      if (res && res.expirationTtl) {
        this.snackbar.success(this.translate.instant('verifyCodeSent', { seconds: res.expirationTtl }));
        this.verifyCodeExpire = Date.now() + res.expirationTtl * 1000;
        this.startVerifyCodeCountdown();
      }
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('sendCodeFailed'));
    }
  }

  private startVerifyCodeCountdown() {
    // 清除之前的定时器
    if (this.verifyCodeIntervalId) {
      clearInterval(this.verifyCodeIntervalId);
    }
    
    this.verifyCodeIntervalId = setInterval(() => {
      const remaining = Math.round((this.verifyCodeExpire - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(this.verifyCodeIntervalId);
        this.verifyCodeIntervalId = null;
        this.verifyCodeTimeout.set(0);
      } else {
        this.verifyCodeTimeout.set(remaining);
      }
    }, 1000);
  }

  async emailSignup() {
    if (!this.user.email || !this.user.password) {
      this.snackbar.error(this.translate.instant('pleaseEnterEmailAndPassword'));
      return;
    }
    if (!this.user.code && this.state.userOpenSettings().enableMailVerify) {
      this.snackbar.error(this.translate.instant('pleaseEnterVerifyCode'));
      return;
    }
    try {
      const hashedPassword = await hashPassword(this.user.password);
      await this.api.userRegister(this.user.email, hashedPassword, this.user.code);
      this.selectedTab = 0;
      this.snackbar.success(this.translate.instant('pleaseLogin'));
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('registerFailed'));
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
      this.snackbar.error(error.message || this.translate.instant('passkeyLoginFailed'));
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
      this.snackbar.error(error.message || this.translate.instant('loginFailed'));
    }
  }
}

@Component({
  selector: 'app-forgot-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'forgotPassword' | translate }}</h2>
    <mat-dialog-content>
      @if (data.enable && data.enableMailVerify) {
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'email' | translate }}</mat-label>
          <input matInput [(ngModel)]="email" type="email">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'newPassword' | translate }}</mat-label>
          <input matInput [(ngModel)]="password" type="password">
        </mat-form-field>
        <div class="verify-code-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>{{ 'verifyCode' | translate }}</mat-label>
            <input matInput [(ngModel)]="code">
          </mat-form-field>
          <button mat-stroked-button color="primary" [disabled]="verifyCodeTimeout > 0" (click)="sendVerificationCode()">
            {{ verifyCodeTimeout > 0 ? (('waitSeconds' | translate:{seconds: verifyCodeTimeout})) : ('sendCode' | translate) }}
          </button>
        </div>
      } @else {
        <div class="warning-alert">
          <mat-icon>warning</mat-icon>
          <span>{{ 'resetPasswordDisabled' | translate }}</span>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      @if (data.enable && data.enableMailVerify) {
        <button mat-raised-button color="primary" (click)="resetPassword()">{{ 'resetPassword' | translate }}</button>
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
  private translate = inject(TranslateService);

  email = '';
  password = '';
  code = '';
  verifyCodeTimeout = 0;
  private verifyCodeExpire = 0;
  private verifyCodeIntervalId: any = null;

  async sendVerificationCode() {
    if (!this.email) {
      this.snackbar.error(this.translate.instant('pleaseEnterEmail'));
      return;
    }
    try {
      const res = await this.api.sendVerifyCode(this.email, '');
      if (res && res.expirationTtl) {
        this.snackbar.success(this.translate.instant('verifyCodeSent', { seconds: res.expirationTtl }));
        this.verifyCodeExpire = Date.now() + res.expirationTtl * 1000;
        this.startVerifyCodeCountdown();
      }
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('sendCodeFailed'));
    }
  }

  private startVerifyCodeCountdown() {
    // 清除之前的定时器
    if (this.verifyCodeIntervalId) {
      clearInterval(this.verifyCodeIntervalId);
    }
    
    this.verifyCodeIntervalId = setInterval(() => {
      const remaining = Math.round((this.verifyCodeExpire - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(this.verifyCodeIntervalId);
        this.verifyCodeIntervalId = null;
        this.verifyCodeTimeout = 0;
      } else {
        this.verifyCodeTimeout = remaining;
      }
    }, 1000);
  }

  async resetPassword() {
    if (!this.email || !this.password || !this.code) {
      this.snackbar.error(this.translate.instant('pleaseCompleteForm'));
      return;
    }
    try {
      const hashedPassword = await hashPassword(this.password);
      await this.api.userRegister(this.email, hashedPassword, this.code);
      this.dialogRef.close(true);
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('resetFailed'));
    }
  }
}
