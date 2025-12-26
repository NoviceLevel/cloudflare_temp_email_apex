import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { hashPassword } from '../../utils';
import { TurnstileComponent } from '../turnstile/turnstile.component';
import { AddressManagementComponent } from '../../views/user/address-management/address-management.component';
import { TelegramAddressComponent } from '../../views/index/telegram-address/telegram-address.component';
import { LocalAddressComponent } from '../../views/index/local-address/local-address.component';

@Component({
  selector: 'app-address-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatExpansionModule,
    MatDialogModule,
    TranslateModule,
    TurnstileComponent,
    TelegramAddressComponent,
  ],
  template: `
    <!-- 加载中 -->
    @if (!state.openSettings().fetched) {
      <mat-card class="loading-card">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'loading' | translate }}</p>
      </mat-card>
    }
    
    <!-- 已登录，显示地址 -->
    @else if (state.settings().address) {
      <div class="address-display">
        <div class="address-info">
          <mat-icon>email</mat-icon>
          <strong class="address-text">{{ addressLabel() }}</strong>
        </div>
        <div class="address-actions">
          @if (state.isTelegram()) {
            <button mat-stroked-button color="primary" (click)="openTelegramChangeAddressDialog()">
              <mat-icon>swap_horiz</mat-icon>
              {{ 'addressManage' | translate }}
            </button>
          } @else if (state.userJwt()) {
            <button mat-stroked-button color="primary" (click)="openChangeAddressDialog()">
              <mat-icon>swap_horiz</mat-icon>
              {{ 'changeAddress' | translate }}
            </button>
          } @else {
            <button mat-stroked-button color="primary" (click)="openLocalAddressDialog()">
              <mat-icon>swap_horiz</mat-icon>
              {{ 'addressManage' | translate }}
            </button>
          }
          <button mat-stroked-button color="primary" (click)="copyAddress()">
            <mat-icon>content_copy</mat-icon>
            {{ 'copy' | translate }}
          </button>
        </div>
      </div>
    }
    
    <!-- Telegram 用户未登录 -->
    @else if (state.isTelegram()) {
      <app-telegram-address></app-telegram-address>
    }
    
    <!-- 未登录，显示登录表单 -->
    @else {
      <div class="login-wrapper">
        <mat-card class="login-card">
          <mat-card-content>
            @if (state.userSettings().user_email) {
              <div class="info-alert mb-3">
                <mat-icon>info</mat-icon>
                <span>{{ 'loggedInUserBindTip' | translate }}</span>
              </div>
            }
            
            @if (state.jwt() && showJwtWarning()) {
              <div class="warning-alert mb-3">
                <mat-icon>warning</mat-icon>
                <span>{{ 'fetchAddressError' | translate }}</span>
                <button mat-icon-button (click)="showJwtWarning.set(false); clearInvalidJwt()">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }

            <mat-tab-group [(selectedIndex)]="tabIndex" animationDuration="0ms">
              <!-- 登录 Tab -->
              <mat-tab [label]="'login' | translate">
                <div class="tab-content">
                  @if (loginMethod() === 'password') {
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>{{ 'emailAddress' | translate }}</mat-label>
                      <input matInput [(ngModel)]="loginAddress" placeholder="your&#64;email.com">
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>{{ 'password' | translate }}</mat-label>
                      <input matInput type="password" [(ngModel)]="loginPassword">
                    </mat-form-field>
                  } @else {
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>{{ 'addressCredential' | translate }}</mat-label>
                      <textarea matInput [(ngModel)]="credential" rows="3"></textarea>
                    </mat-form-field>
                  }

                  @if (state.openSettings().enableAddressPassword) {
                    <div class="switch-login-method">
                      <button mat-button color="primary" (click)="toggleLoginMethod()">
                        {{ loginMethod() === 'password' ? ('useCredentialLogin' | translate) : ('usePasswordLogin' | translate) }}
                      </button>
                    </div>
                  }

                  <button mat-stroked-button color="primary" class="full-width mb-2" 
                          (click)="login()" [disabled]="state.loading()">
                    @if (state.loading()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>login</mat-icon>
                      {{ 'login' | translate }}
                    }
                  </button>

                  @if (showNewAddressTab()) {
                    <button mat-stroked-button class="full-width" (click)="tabIndex = 1">
                      <mat-icon>add</mat-icon>
                      {{ 'createNewEmail' | translate }}
                    </button>
                  }
                </div>
              </mat-tab>

              <!-- 注册 Tab -->
              @if (showNewAddressTab()) {
                <mat-tab [label]="'createNewEmail' | translate">
                  <div class="tab-content">
                    @if (!state.openSettings().disableCustomAddressName) {
                      <p class="hint-text">{{ 'addressNameHint' | translate:{ regex: addressRegex().source } }}</p>
                      <p class="hint-text">{{ 'addressNameEmptyHint' | translate }}</p>
                    }
                    <p class="hint-text">{{ 'selectDomainHint' | translate }}</p>

                    @if (!state.openSettings().disableCustomAddressName) {
                      <button mat-button color="primary" class="mb-2" (click)="generateName()">
                        <mat-icon>refresh</mat-icon>
                        {{ 'generateRandomName' | translate }}
                      </button>
                    }

                    <div class="email-input-row">
                      @if (addressPrefix()) {
                        <span class="prefix-chip">{{ addressPrefix() }}</span>
                      }
                      
                      @if (!state.openSettings().disableCustomAddressName) {
                        <mat-form-field appearance="outline" class="email-name-field">
                          <mat-label>{{ 'emailName' | translate }}</mat-label>
                          <input matInput [(ngModel)]="emailName" 
                                 [maxlength]="state.openSettings().maxAddressLen">
                          <mat-hint>{{ emailName.length }}/{{ state.openSettings().maxAddressLen }}</mat-hint>
                        </mat-form-field>
                      } @else {
                        <mat-form-field appearance="outline" class="email-name-field">
                          <mat-label>{{ 'emailName' | translate }}</mat-label>
                          <input matInput [value]="'autoGenerate' | translate" disabled>
                        </mat-form-field>
                      }

                      <span class="at-symbol">&#64;</span>

                      <mat-form-field appearance="outline" class="domain-field">
                        <mat-label>{{ 'domain' | translate }}</mat-label>
                        <mat-select [(ngModel)]="emailDomain">
                          @for (domain of domainsOptions(); track domain.value) {
                            <mat-option [value]="domain.value">{{ domain.label }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>

                    <app-turnstile (tokenChange)="cfToken = $event"></app-turnstile>

                    <button mat-stroked-button color="primary" class="full-width"
                            (click)="createNewEmail()" [disabled]="state.loading()">
                      @if (state.loading()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        <mat-icon>add</mat-icon>
                        {{ 'createNewEmail' | translate }}
                      }
                    </button>
                  </div>
                </mat-tab>
              }

              <!-- 帮助 Tab -->
              <mat-tab [label]="'help' | translate">
                <div class="tab-content">
                  <div class="info-alert mb-3">
                    <mat-icon>info</mat-icon>
                    <span>{{ 'helpTip' | translate }}</span>
                  </div>
                  @if (state.openSettings().adminContact) {
                    <div class="info-alert">
                      <mat-icon>contact_support</mat-icon>
                      <span>{{ 'adminContact' | translate }}: {{ state.openSettings().adminContact }}</span>
                    </div>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>

            <mat-divider class="my-3"></mat-divider>

            <button mat-stroked-button color="primary" class="full-width" (click)="goToUserLogin()">
              <mat-icon>account_circle</mat-icon>
              {{ 'userLogin' | translate }}
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .loading-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      gap: 16px;
    }
    .address-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .address-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .address-text {
      font-size: 16px;
    }
    .address-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .login-wrapper {
      display: flex;
      justify-content: center;
      margin: 16px 0;
    }
    .login-card {
      max-width: 600px;
      width: 100%;
      padding: 16px;
    }
    .tab-content {
      padding: 16px 0;
    }
    .full-width {
      width: 100%;
    }
    .mb-2 {
      margin-bottom: 8px;
    }
    .mb-3 {
      margin-bottom: 12px;
    }
    .my-3 {
      margin: 12px 0;
    }
    .switch-login-method {
      text-align: center;
      margin-bottom: 16px;
    }
    .hint-text {
      color: #666;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .email-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .prefix-chip {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      color: #424242;
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 14px;
    }
    .email-name-field {
      flex: 1;
      min-width: 120px;
    }
    .at-symbol {
      font-weight: bold;
      font-size: 18px;
    }
    .domain-field {
      min-width: 150px;
    }
    button mat-spinner {
      display: inline-block;
      margin-right: 8px;
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
    .warning-alert span {
      flex: 1;
    }
    .warning-alert button {
      margin-left: auto;
    }
    .info-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      color: #424242;
    }
    :host-context(.dark-theme) .address-display {
      background: #303134;
      border-color: #5f6368;
    }
    :host-context(.dark-theme) .warning-alert {
      background-color: #3c3000;
      color: #fdd663;
    }
    :host-context(.dark-theme) .info-alert {
      background-color: #303134;
      border-color: #5f6368;
      color: #e8eaed;
    }
    :host-context(.dark-theme) .hint-text {
      color: #9aa0a6;
    }
    :host-context(.dark-theme) .prefix-chip {
      background: #303134;
      border-color: #5f6368;
      color: #e8eaed;
    }
  `],
})
export class AddressBarComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  tabIndex = 0;
  credential = '';
  emailName = '';
  emailDomain = '';
  loginAddress = '';
  loginPassword = '';
  cfToken = '';
  loginMethod = signal<'credential' | 'password'>('credential');
  showJwtWarning = signal(true);

  addressLabel = computed(() => {
    const address = this.state.settings().address;
    if (!address) return '';
    
    const domain = address.split('@')[1];
    const domainObj = this.state.openSettings().domains.find(d => d.value === domain);
    if (!domainObj) return address;
    return address.replace('@' + domain, `@${domainObj.label}`);
  });

  addressPrefix = computed(() => {
    const userRole = this.state.userSettings().user_role;
    if (userRole?.prefix) return userRole.prefix;
    return this.state.openSettings().prefix;
  });

  addressRegex = computed(() => {
    try {
      if (this.state.openSettings().addressRegex) {
        return new RegExp(this.state.openSettings().addressRegex, 'g');
      }
    } catch (error) {
      console.error(error);
    }
    return /[^a-z0-9]/g;
  });

  domainsOptions = computed(() => {
    const userRole = this.state.userSettings().user_role;
    const openSettings = this.state.openSettings();
    
    if (userRole?.domains) {
      return openSettings.domains.filter(d => userRole.domains!.includes(d.value));
    }
    if (openSettings.defaultDomains && openSettings.defaultDomains.length > 0) {
      return openSettings.domains.filter(d => openSettings.defaultDomains.includes(d.value));
    }
    return openSettings.domains;
  });

  showNewAddressTab = computed(() => {
    const openSettings = this.state.openSettings();
    const userSettings = this.state.userSettings();
    
    if (openSettings.disableAnonymousUserCreateEmail && !userSettings.user_email) {
      return false;
    }
    return openSettings.enableUserCreateEmail;
  });

  async ngOnInit() {
    // 获取公开设置
    if (!this.state.openSettings().fetched) {
      await this.api.getOpenSettings();
    }
    
    // 初始化登录方式
    if (this.state.openSettings().enableAddressPassword) {
      this.loginMethod.set('password');
    }
    
    // 设置默认域名 - 必须在 getOpenSettings 完成后
    this.initDefaultDomain();
    
    // 获取用户设置（如果有 jwt）
    if (this.state.jwt() && !this.state.settings().fetched) {
      try {
        await this.api.getSettings();
      } catch (e) {
        console.error('getSettings error:', e);
        // 如果获取设置失败，显示警告
      }
    }
  }

  private initDefaultDomain() {
    const domains = this.domainsOptions();
    if (domains.length > 0 && !this.emailDomain) {
      this.emailDomain = domains[0].value;
    }
  }

  toggleLoginMethod() {
    this.loginMethod.update(m => m === 'password' ? 'credential' : 'password');
  }

  async copyAddress() {
    try {
      await navigator.clipboard.writeText(this.state.settings().address);
      this.snackbar.success(this.translate.instant('copied'));
    } catch (e) {
      this.snackbar.error(this.translate.instant('copyFailed'));
    }
  }

  async copyCredential() {
    try {
      await navigator.clipboard.writeText(this.state.jwt());
      this.snackbar.success(this.translate.instant('copied'));
    } catch (e) {
      this.snackbar.error(this.translate.instant('copyFailed'));
    }
  }

  openCredentialDialog() {
    this.dialog.open(AddressCredentialDialogComponent, {
      width: '600px',
      data: {
        jwt: this.state.jwt(),
        address: this.state.settings().address,
        addressPassword: this.state.addressPassword()
      }
    });
  }

  openLocalAddressDialog() {
    this.dialog.open(LocalAddressDialogComponent, {
      width: '600px'
    });
  }

  openChangeAddressDialog() {
    this.dialog.open(ChangeAddressDialogComponent, {
      width: '600px'
    });
  }

  openTelegramChangeAddressDialog() {
    this.dialog.open(TelegramChangeAddressDialogComponent, {
      width: '600px'
    });
  }

  getUrlWithJwt(): string {
    return `${window.location.origin}/?jwt=${this.state.jwt()}`;
  }

  goToUserLogin() {
    this.router.navigate(['/user']);
  }

  clearInvalidJwt() {
    // 清除无效的 jwt
    this.state.setJwt('');
  }

  async login() {
    try {
      if (this.loginMethod() === 'password') {
        if (!this.loginAddress || !this.loginPassword) {
          this.snackbar.error(this.translate.instant('pleaseEnterEmailAndPassword'));
          return;
        }
        const hashedPassword = await hashPassword(this.loginPassword);
        const res = await this.api.addressLogin(this.loginAddress, hashedPassword);
        this.state.setJwt(res.jwt);
      } else {
        if (!this.credential) {
          this.snackbar.error(this.translate.instant('pleaseEnterCredential'));
          return;
        }
        this.state.setJwt(this.credential);
      }
      
      await this.api.getSettings();
      
      // 绑定用户地址
      try {
        await this.api.bindUserAddress();
      } catch (e: any) {
        console.error('绑定用户地址失败:', e.message);
      }
      
      this.snackbar.success(this.translate.instant('loginSuccess'));
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('loginFailed'));
    }
  }

  async generateName() {
    try {
      const { faker } = await import('@faker-js/faker');
      let name = faker.internet.email()
        .split('@')[0]
        .replace(/\s+/g, '.')
        .replace(/\.{2,}/g, '.')
        .replace(this.addressRegex(), '')
        .toLowerCase();
      if (name.length > this.state.openSettings().maxAddressLen) {
        name = name.slice(0, this.state.openSettings().maxAddressLen);
      }
      this.emailName = name;
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async createNewEmail() {
    this.initDefaultDomain();
    
    if (!this.emailDomain) {
      this.snackbar.error(this.translate.instant('pleaseSelectDomain'));
      return;
    }

    try {
      const name = this.state.openSettings().disableCustomAddressName ? '' : this.emailName;
      const res = await this.api.newAddress(name, this.emailDomain, this.cfToken);
      
      this.state.setJwt(res.jwt);
      if (res.password) {
        this.state.setAddressPassword(res.password);
      }
      
      await this.api.getSettings();
      this.openCredentialDialog();
      
      try {
        await this.api.bindUserAddress();
      } catch (e: any) {
        console.error('绑定用户地址失败:', e.message);
      }
      
      this.snackbar.success(this.translate.instant('emailCreatedSuccess'));
    } catch (error: any) {
      this.snackbar.error(error.message || this.translate.instant('createFailed'));
    }
  }
}


// Address Credential Dialog Component
@Component({
  selector: 'app-address-credential-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'addressCredential' | translate }}</h2>
    <mat-dialog-content>
      <p class="mb-3">{{ 'addressCredentialTip' | translate }}</p>
      <mat-card appearance="outlined" class="credential-card mb-3">
        <mat-card-content>
          <strong class="credential-text">{{ data.jwt }}</strong>
        </mat-card-content>
      </mat-card>
      @if (data.addressPassword) {
        <mat-card appearance="outlined" class="credential-card mb-3">
          <mat-card-content>
            <p><strong>{{ data.address }}</strong></p>
            <p>{{ 'addressPassword' | translate }}: <strong>{{ data.addressPassword }}</strong></p>
          </mat-card-content>
        </mat-card>
      }
      <mat-expansion-panel>
        <mat-expansion-panel-header>
          <mat-panel-title>{{ 'linkWithAddressCredential' | translate }}</mat-panel-title>
        </mat-expansion-panel-header>
        <mat-card appearance="outlined" class="credential-card">
          <mat-card-content>
            <strong class="credential-text">{{ getUrlWithJwt() }}</strong>
          </mat-card-content>
        </mat-card>
      </mat-expansion-panel>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="copyCredential()">
        <mat-icon>content_copy</mat-icon>
        {{ 'copy' | translate }}
      </button>
      <button mat-button mat-dialog-close>{{ 'ok' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .mb-3 { margin-bottom: 12px; }
    .credential-card {
      background: #f5f5f5;
      word-break: break-all;
    }
    .credential-text {
      word-break: break-all;
    }
    :host-context(.dark-theme) .credential-card {
      background: #303134;
    }
  `]
})
export class AddressCredentialDialogComponent {
  data = inject<{ jwt: string; address: string; addressPassword: string }>(MAT_DIALOG_DATA);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  getUrlWithJwt(): string {
    return `${window.location.origin}/?jwt=${this.data.jwt}`;
  }

  async copyCredential() {
    try {
      await navigator.clipboard.writeText(this.data.jwt);
      this.snackbar.success(this.translate.instant('copied'));
    } catch (e) {
      this.snackbar.error(this.translate.instant('copyFailed'));
    }
  }
}

// Local Address Dialog Component
@Component({
  selector: 'app-local-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule,
    LocalAddressComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'addressManage' | translate }}</h2>
    <mat-dialog-content class="dialog-content">
      <app-local-address></app-local-address>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-height: 200px;
      overflow: visible;
    }
  `]
})
export class LocalAddressDialogComponent {}

// Change Address Dialog Component
@Component({
  selector: 'app-change-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule,
    AddressManagementComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'changeAddress' | translate }}</h2>
    <mat-dialog-content class="dialog-content">
      <app-address-management></app-address-management>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-height: 200px;
      overflow: visible;
    }
  `]
})
export class ChangeAddressDialogComponent {}

// Telegram Change Address Dialog Component
@Component({
  selector: 'app-telegram-change-address-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    TranslateModule,
    TelegramAddressComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'changeAddress' | translate }}</h2>
    <mat-dialog-content class="dialog-content">
      <app-telegram-address></app-telegram-address>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-height: 200px;
      overflow: visible;
    }
  `]
})
export class TelegramChangeAddressDialogComponent {}
