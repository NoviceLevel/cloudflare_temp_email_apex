import { Component, inject, OnInit, signal, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { hashPassword } from '../../../utils';
import { AdminContactComponent } from '../admin-contact/admin-contact.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    TranslateModule,
    AdminContactComponent,
  ],
  template: `
    <div class="login-container">
      @if (state.userSettings().user_email) {
        <div class="info-alert mb-3">
          <mat-icon>info</mat-icon>
          <span>{{ 'loggedInUserBindTip' | translate }}</span>
        </div>
      }

      @if (state.openSettings().fetched) {
        <mat-tab-group [(selectedIndex)]="selectedTab" color="primary">
          <mat-tab [label]="loginAndBindTag()"></mat-tab>
          @if (showNewAddressTab()) {
            <mat-tab [label]="'createNewEmail' | translate"></mat-tab>
          }
          <mat-tab [label]="'help' | translate"></mat-tab>
        </mat-tab-group>

        <div class="tab-content">
          @if (selectedTab === 0) {
            <!-- Login -->
            @if (loginMethod === 'password') {
              <mat-form-field appearance="outline" class="full-width mb-2">
                <mat-label>{{ 'email' | translate }}</mat-label>
                <input matInput [(ngModel)]="loginAddress" type="email">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width mb-2">
                <mat-label>{{ 'password' | translate }}</mat-label>
                <input matInput [(ngModel)]="loginPassword" type="password">
              </mat-form-field>
            } @else {
              <mat-form-field appearance="outline" class="full-width mb-2">
                <mat-label>{{ 'addressCredential' | translate }}</mat-label>
                <textarea matInput [(ngModel)]="credential" rows="3"></textarea>
              </mat-form-field>
            }

            @if (state.openSettings().enableAddressPassword) {
              <div class="text-center mb-2">
                <button mat-button color="primary" (click)="toggleLoginMethod()">
                  {{ loginMethod === 'password' ? ('credentialLogin' | translate) : ('passwordLogin' | translate) }}
                </button>
              </div>
            }

            <button mat-stroked-button color="primary" class="full-width mb-2" (click)="login()">
              <mat-icon>email</mat-icon>
              {{ loginAndBindTag() }}
            </button>

            @if (showNewAddressTab()) {
              <button mat-stroked-button class="full-width" (click)="selectedTab = 1">
                <mat-icon>add</mat-icon>
                {{ 'createNewEmail' | translate }}
              </button>
            }
          } @else if (selectedTab === 1 && showNewAddressTab()) {
            <!-- Create new email -->
            @if (!state.openSettings().disableCustomAddressName) {
              <p class="mb-2">{{ 'addressNameHintText' | translate:{ regex: addressRegex().source } }}</p>
              <p class="mb-2">{{ 'leaveEmptyForRandom' | translate }}</p>
            }
            <p class="mb-3">{{ 'selectDomainFromList' | translate }}</p>

            @if (!state.openSettings().disableCustomAddressName) {
              <button mat-button color="primary" class="mb-3" (click)="generateName()">
                <mat-icon>refresh</mat-icon>
                {{ 'generateRandomName' | translate }}
              </button>
            }

            <div class="email-row">
              @if (addressPrefix()) {
                <mat-chip>{{ addressPrefix() }}</mat-chip>
              }
              @if (!state.openSettings().disableCustomAddressName) {
                <mat-form-field appearance="outline" class="flex-1">
                  <input matInput [(ngModel)]="emailName" 
                         [maxlength]="state.openSettings().maxAddressLen">
                  <mat-hint>{{ emailName.length }}/{{ state.openSettings().maxAddressLen }}</mat-hint>
                </mat-form-field>
              } @else {
                <mat-form-field appearance="outline" class="flex-1">
                  <input matInput [value]="'autoGenerateName' | translate" disabled>
                </mat-form-field>
              }
              <mat-chip>&#64;</mat-chip>
              <mat-form-field appearance="outline" class="flex-1">
                <mat-select [(ngModel)]="emailDomain">
                  @for (domain of domainsOptions(); track domain.value) {
                    <mat-option [value]="domain.value">{{ domain.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <button mat-stroked-button color="primary" class="full-width mt-3" (click)="newEmail()">
              <mat-icon>add</mat-icon>
              {{ 'createNewEmail' | translate }}
            </button>
          } @else {
            <!-- Help -->
            <div class="info-alert mb-3">
              <mat-icon>info</mat-icon>
              <span>{{ 'registerNewEmailHint' | translate }}</span>
            </div>
            <app-admin-contact></app-admin-contact>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .login-container {
      max-width: 600px;
      width: 100%;
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
    .mt-3 {
      margin-top: 12px;
    }
    .text-center {
      text-align: center;
    }
    .info-alert {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
    }
    .info-alert mat-icon {
      flex-shrink: 0;
    }
    .email-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .flex-1 {
      flex: 1;
      min-width: 120px;
    }
    :host-context(.dark-theme) .info-alert {
      background-color: #1e3a5f;
      color: #90caf9;
    }
  `]
})
export class LoginComponent implements OnInit {
  @Input() bindUserAddress: () => Promise<void> = async () => {
    await this.api.bindUserAddress();
  };

  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  selectedTab = 0;
  loginMethod = 'credential';
  credential = '';
  loginAddress = '';
  loginPassword = '';
  emailName = '';
  emailDomain = '';
  cfToken = '';

  loginAndBindTag = computed(() => {
    return this.state.userSettings().user_email ? this.translate.instant('loginAndBind') : this.translate.instant('login');
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

  addressPrefix = computed(() => {
    if (this.state.userSettings().user_role) {
      return this.state.userSettings().user_role?.prefix || '';
    }
    return this.state.openSettings().prefix;
  });

  domainsOptions = computed(() => {
    const userRole = this.state.userSettings().user_role;
    if (userRole) {
      const allDomains = userRole.domains;
      if (!allDomains) return this.state.openSettings().domains;
      return this.state.openSettings().domains.filter(domain => allDomains.includes(domain.value));
    }
    const defaultDomains = this.state.openSettings().defaultDomains;
    if (!defaultDomains || defaultDomains.length === 0) {
      return this.state.openSettings().domains;
    }
    return this.state.openSettings().domains.filter(domain => defaultDomains.includes(domain.value));
  });

  showNewAddressTab = computed(() => {
    if (this.state.openSettings().disableAnonymousUserCreateEmail && !this.state.userSettings().user_email) {
      return false;
    }
    return this.state.openSettings().enableUserCreateEmail;
  });

  async ngOnInit() {
    if (!this.state.openSettings().domains || this.state.openSettings().domains.length === 0) {
      await this.api.getOpenSettings();
    }
    const domains = this.domainsOptions();
    this.emailDomain = domains.length > 0 ? domains[0].value : '';
    this.initLoginMethod();
  }

  initLoginMethod() {
    if (this.state.openSettings().enableAddressPassword) {
      this.loginMethod = 'password';
    } else {
      this.loginMethod = 'credential';
    }
  }

  toggleLoginMethod() {
    this.loginMethod = this.loginMethod === 'password' ? 'credential' : 'password';
  }

  async login() {
    if (this.loginMethod === 'password') {
      if (!this.loginAddress || !this.loginPassword) {
        this.snackbar.error(this.translate.instant('emailAndPasswordRequired'));
        return;
      }
      try {
        const hashedPassword = await hashPassword(this.loginPassword);
        const res = await this.api.addressLogin(this.loginAddress, hashedPassword);
        this.state.setJwt(res.jwt);
        await this.api.getSettings();
        try {
          await this.bindUserAddress();
        } catch (error: any) {
          this.snackbar.error(`${this.translate.instant('bindAddressToUserError')}: ${error.message}`);
        }
        await this.router.navigate(['/']);
      } catch (error: any) {
        this.snackbar.error(error.message || 'error');
      }
      return;
    }

    if (!this.credential) {
      this.snackbar.error(this.translate.instant('pleaseEnterCredential'));
      return;
    }
    try {
      this.state.setJwt(this.credential);
      await this.api.getSettings();
      try {
        await this.bindUserAddress();
      } catch (error: any) {
        this.snackbar.error(`${this.translate.instant('bindAddressToUserError')}: ${error.message}`);
      }
      await this.router.navigate(['/']);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
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

  async newEmail() {
    try {
      const nameToSend = this.state.openSettings().disableCustomAddressName ? '' : this.emailName;
      const res = await this.api.newAddress(nameToSend, this.emailDomain, this.cfToken);
      this.state.setJwt(res.jwt);
      this.state.setAddressPassword(res.password || '');
      await this.api.getSettings();
      await this.router.navigate(['/']);
      this.state.showAddressCredential.set(true);
      try {
        await this.bindUserAddress();
      } catch (error: any) {
        this.snackbar.error(`${this.translate.instant('bindAddressToUserError')}: ${error.message}`);
      }
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}
