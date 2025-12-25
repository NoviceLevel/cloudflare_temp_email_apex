import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { I18nService } from '../../services/i18n.service';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { LoginComponent } from '../../components/login/login.component';
import { MailBoxComponent } from '../index/mail-box/mail-box.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule, MatIconModule,
    MatButtonModule, MatTableModule, MatChipsModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDialogModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatDividerModule, LoginComponent, MailBoxComponent
  ],
  template: `
    <div class="user-container">
      <!-- User Bar -->
      @if (!userSettings().fetched) {
        <mat-card class="mb-4">
          <mat-card-content class="loading-card">
            <mat-spinner diameter="40"></mat-spinner>
            <span>{{ t()('loading') }}</span>
          </mat-card-content>
        </mat-card>
      } @else if (userSettings().userEmail) {
        <div class="user-alert success mb-4">
          <mat-icon>check_circle</mat-icon>
          <strong>{{ t()('currentUser') }}: {{ userSettings().userEmail }}</strong>
        </div>
      } @else {
        <mat-card class="login-card mb-4">
          <mat-card-content>
            @if (state.userJwt()) {
              <div class="user-alert warning mb-3">
                <mat-icon>warning</mat-icon>
                {{ t()('fetchUserSettingsError') }}
              </div>
            }
            <app-login></app-login>
          </mat-card-content>
        </mat-card>
      }

      <!-- Tabs (only show when logged in) -->
      @if (userSettings().userEmail) {
        <mat-card>
          <mat-tab-group [(selectedIndex)]="selectedTab" animationDuration="200ms">
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>folder</mat-icon>{{ t()('addressManagement') }}
              </ng-template>
              <div class="tab-content">
                <!-- Address Management Sub-tabs -->
                <mat-tab-group [(selectedIndex)]="addressSubTab" animationDuration="200ms">
                  <mat-tab [label]="t()('address')">
                    <div class="sub-tab-content">
                      <div class="table-container">
                        <table mat-table [dataSource]="addressData()">
                          <ng-container matColumnDef="name">
                            <th mat-header-cell *matHeaderCellDef>{{ t()('name') }}</th>
                            <td mat-cell *matCellDef="let row">{{ row.name }}</td>
                          </ng-container>
                          <ng-container matColumnDef="mail_count">
                            <th mat-header-cell *matHeaderCellDef>{{ t()('mailCount') }}</th>
                            <td mat-cell *matCellDef="let row">
                              <span class="chip success">{{ row.mail_count }}</span>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="send_count">
                            <th mat-header-cell *matHeaderCellDef>{{ t()('sendCount') }}</th>
                            <td mat-cell *matCellDef="let row">
                              <span class="chip success">{{ row.send_count }}</span>
                            </td>
                          </ng-container>
                          <ng-container matColumnDef="actions">
                            <th mat-header-cell *matHeaderCellDef>{{ t()('actions') }}</th>
                            <td mat-cell *matCellDef="let row">
                              <button mat-button color="primary" (click)="confirmChange(row)">
                                {{ t()('changeMailAddress') }}
                              </button>
                              <button mat-button color="primary" (click)="openTransfer(row)">
                                {{ t()('transferAddress') }}
                              </button>
                              <button mat-button color="warn" (click)="confirmUnbind(row)">
                                {{ t()('unbindAddress') }}
                              </button>
                            </td>
                          </ng-container>
                          <tr mat-header-row *matHeaderRowDef="addressColumns"></tr>
                          <tr mat-row *matRowDef="let row; columns: addressColumns;"></tr>
                        </table>
                      </div>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="t()('createOrBind')">
                    <div class="sub-tab-content center-content">
                      <mat-card class="login-inner-card">
                        <mat-card-content>
                          <app-login></app-login>
                        </mat-card-content>
                      </mat-card>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>inbox</mat-icon>{{ t()('userMailBox') }}
              </ng-template>
              <div class="tab-content">
                <div class="filter-row">
                  <mat-form-field appearance="outline" class="address-filter">
                    <mat-label>{{ t()('addressQueryTip') }}</mat-label>
                    <mat-select [(ngModel)]="addressFilter" (selectionChange)="queryMail()">
                      <mat-option [value]="''">{{ t()('allAddresses') }}</mat-option>
                      @for (addr of addressFilterOptions(); track addr.value) {
                        <mat-option [value]="addr.value">{{ addr.title }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <button mat-flat-button color="primary" (click)="queryMail()">
                    {{ t()('query') }}
                  </button>
                </div>
                <app-mail-box 
                  [fetchMailDataFn]="fetchUserMailData.bind(this)"
                  [deleteMailFn]="deleteUserMail.bind(this)"
                  [showFilterInput]="true"
                  [enableUserDeleteEmail]="true">
                </app-mail-box>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>settings</mat-icon>{{ t()('userSettings') }}
              </ng-template>
              <div class="tab-content center-content">
                <mat-card class="settings-card">
                  <mat-card-content>
                    <button mat-stroked-button class="full-width mb-2" (click)="showPasskeyList()">
                      {{ t()('showPasskeyList') }}
                    </button>
                    <button mat-stroked-button color="primary" class="full-width mb-2" (click)="showCreatePasskeyDialog = true">
                      {{ t()('createPasskey') }}
                    </button>
                    <div class="info-alert mb-2">
                      <mat-icon>info</mat-icon>
                      {{ t()('passwordTip') }}
                    </div>
                    <button mat-stroked-button class="full-width" (click)="showLogoutDialog = true">
                      {{ t()('logout') }}
                    </button>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>

            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>link</mat-icon>{{ t()('bindAddress') }}
              </ng-template>
              <div class="tab-content center-content">
                <mat-card class="login-inner-card">
                  <mat-card-content>
                    <app-login></app-login>
                  </mat-card-content>
                </mat-card>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      }
    </div>

    <!-- Transfer Address Dialog -->
    @if (showTransferDialog) {
      <div class="dialog-overlay" (click)="showTransferDialog = false">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>{{ t()('transferAddress') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="mb-2">{{ t()('transferAddressTip') }}</p>
            <p class="mb-3"><strong>{{ t()('transferAddress') }}: {{ currentAddress() }}</strong></p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ t()('targetUserEmail') }}</mat-label>
              <input matInput [(ngModel)]="targetUserEmail">
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showTransferDialog = false">{{ t()('cancel') }}</button>
            <button mat-flat-button color="warn" (click)="transferAddress()" [disabled]="loading()">
              {{ t()('transferAddress') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Change Address Confirm Dialog -->
    @if (showChangeDialog) {
      <div class="dialog-overlay" (click)="showChangeDialog = false">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-content>
            <p>{{ t()('changeMailAddress') }}?</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showChangeDialog = false">{{ t()('cancel') }}</button>
            <button mat-flat-button color="primary" (click)="changeMailAddress()">
              {{ t()('changeMailAddress') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Unbind Address Confirm Dialog -->
    @if (showUnbindDialog) {
      <div class="dialog-overlay" (click)="showUnbindDialog = false">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-content>
            <p>{{ t()('unbindAddressTip') }}</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showUnbindDialog = false">{{ t()('cancel') }}</button>
            <button mat-flat-button color="warn" (click)="unbindAddress()">
              {{ t()('unbindAddress') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Create Passkey Dialog -->
    @if (showCreatePasskeyDialog) {
      <div class="dialog-overlay" (click)="showCreatePasskeyDialog = false">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>{{ t()('createPasskey') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ t()('passkeyNamePlaceholder') }}</mat-label>
              <input matInput [(ngModel)]="passkeyName">
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showCreatePasskeyDialog = false">{{ t()('cancel') }}</button>
            <button mat-flat-button color="primary" (click)="createPasskey()" [disabled]="loading()">
              {{ t()('createPasskey') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Passkey List Dialog -->
    @if (showPasskeyListDialog) {
      <div class="dialog-overlay" (click)="showPasskeyListDialog = false">
        <mat-card class="dialog-card wide" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>{{ t()('showPasskeyList') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="passkeyData()">
                <ng-container matColumnDef="passkey_id">
                  <th mat-header-cell *matHeaderCellDef>Passkey ID</th>
                  <td mat-cell *matCellDef="let row">{{ row.passkey_id }}</td>
                </ng-container>
                <ng-container matColumnDef="passkey_name">
                  <th mat-header-cell *matHeaderCellDef>{{ t()('passkeyName') }}</th>
                  <td mat-cell *matCellDef="let row">{{ row.passkey_name }}</td>
                </ng-container>
                <ng-container matColumnDef="created_at">
                  <th mat-header-cell *matHeaderCellDef>{{ t()('createdAt') }}</th>
                  <td mat-cell *matCellDef="let row">{{ row.created_at }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>{{ t()('actions') }}</th>
                  <td mat-cell *matCellDef="let row">
                    <button mat-button color="primary" (click)="openRenamePasskey(row)">
                      {{ t()('renamePasskey') }}
                    </button>
                    <button mat-button color="warn" (click)="openDeletePasskey(row)">
                      {{ t()('deletePasskey') }}
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="passkeyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: passkeyColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showPasskeyListDialog = false">{{ t()('cancel') }}</button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Rename Passkey Dialog -->
    @if (showRenamePasskeyDialog) {
      <div class="dialog-overlay" (click)="showRenamePasskeyDialog = false">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>{{ t()('renamePasskey') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ t()('renamePasskeyPlaceholder') }}</mat-label>
              <input matInput [(ngModel)]="currentPasskeyName">
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showRenamePasskeyDialog = false">{{ t()('cancel') }}</button>
            <button mat-flat-button color="primary" (click)="renamePasskey()" [disabled]="loading()">
              {{ t()('renamePasskey') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Delete Passkey Confirm Dialog -->
    @if (showDeletePasskeyDialog) {
      <div class="dialog-overlay" (click)="showDeletePasskeyDialog = false">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-content>
            <p>{{ t()('deletePasskey') }}?</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showDeletePasskeyDialog = false">{{ t()('cancel') }}</button>
            <button mat-flat-button color="warn" (click)="deletePasskey()">
              {{ t()('deletePasskey') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }

    <!-- Logout Confirm Dialog -->
    @if (showLogoutDialog) {
      <div class="dialog-overlay" (click)="showLogoutDialog = false">
        <mat-card class="dialog-card" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>{{ t()('logout') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>{{ t()('logoutConfirm') }}</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showLogoutDialog = false">{{ t()('cancel') }}</button>
            <button mat-flat-button color="warn" (click)="logout()">
              {{ t()('logout') }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .user-container { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .mb-4 { margin-bottom: 16px; }
    .full-width { width: 100%; }
    .loading-card { display: flex; align-items: center; gap: 16px; padding: 32px; justify-content: center; }
    .user-alert { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 8px; }
    .user-alert.success { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .user-alert.warning { background: var(--mat-sys-error-container); color: var(--mat-sys-on-error-container); }
    .info-alert { display: flex; align-items: flex-start; gap: 8px; padding: 12px; border-radius: 8px; background: var(--mat-sys-surface-variant); color: var(--mat-sys-on-surface-variant); font-size: 14px; }
    .tab-content { padding: 16px; min-height: 400px; }
    .sub-tab-content { padding: 16px 0; }
    .center-content { display: flex; justify-content: center; }
    .login-card { max-width: 600px; margin: 0 auto; }
    .login-inner-card { max-width: 600px; width: 100%; }
    .settings-card { max-width: 600px; width: 100%; }
    .table-container { overflow-x: auto; }
    table { width: 100%; }
    .chip { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
    .chip.success { background: var(--mat-sys-primary-container); color: var(--mat-sys-on-primary-container); }
    .filter-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .address-filter { min-width: 250px; }
    mat-icon { margin-right: 8px; vertical-align: middle; }
    .dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .dialog-card { max-width: 500px; width: 90%; max-height: 90vh; overflow: auto; }
    .dialog-card.wide { max-width: 900px; }
  `]
})
export class UserComponent implements OnInit {
  private i18n = inject(I18nService);
  private api = inject(ApiService);
  state = inject(StateService);
  private snackBar = inject(MatSnackBar);
  
  t = this.i18n.t;
  userSettings = this.state.userSettings;
  loading = this.state.loading;
  
  selectedTab = 0;
  addressSubTab = 0;
  
  // Address Management
  addressData = signal<any[]>([]);
  addressColumns = ['name', 'mail_count', 'send_count', 'actions'];
  currentAddressId = signal(0);
  currentAddress = signal('');
  targetUserEmail = '';
  
  // Dialogs
  showTransferDialog = false;
  showChangeDialog = false;
  showUnbindDialog = false;
  showCreatePasskeyDialog = false;
  showPasskeyListDialog = false;
  showRenamePasskeyDialog = false;
  showDeletePasskeyDialog = false;
  showLogoutDialog = false;
  
  // Passkey
  passkeyName = '';
  passkeyData = signal<any[]>([]);
  passkeyColumns = ['passkey_id', 'passkey_name', 'created_at', 'actions'];
  currentPasskeyId = signal<string | null>(null);
  currentPasskeyName = '';
  
  // User Mail Box
  addressFilter = '';
  addressFilterOptions = signal<{title: string; value: string}[]>([]);
  mailBoxKey = signal(Date.now());

  ngOnInit() {
    this.fetchUserSettings();
    this.fetchAddressData();
  }

  private fetchUserSettings() {
    this.api.getUserSettings().subscribe({
      next: (res) => {
        this.state.userSettings.set({
          fetched: true,
          userEmail: res.user_email || '',
          userId: res.user_id || 0,
          isAdmin: res.is_admin || false,
        });
      },
      error: () => {
        this.state.userSettings.set({ ...this.state.userSettings(), fetched: true });
      }
    });
  }

  fetchAddressData() {
    this.api.fetch<{results: any[]}>('/user_api/bind_address').subscribe({
      next: (res) => {
        this.addressData.set(res.results || []);
        this.addressFilterOptions.set(
          (res.results || []).map((item: any) => ({ title: item.name, value: item.name }))
        );
      },
      error: (err) => this.showMessage(err.message, true)
    });
  }

  confirmChange(row: any) {
    this.currentAddressId.set(row.id);
    this.currentAddress.set(row.name);
    this.showChangeDialog = true;
  }

  changeMailAddress() {
    this.api.fetch<{jwt: string}>(`/user_api/bind_address_jwt/${this.currentAddressId()}`).subscribe({
      next: (res) => {
        if (res.jwt) {
          this.state.setJwt(res.jwt);
          this.showMessage(this.t()('success'));
          this.showChangeDialog = false;
          window.location.reload();
        }
      },
      error: (err) => this.showMessage(err.message, true)
    });
  }

  confirmUnbind(row: any) {
    this.currentAddressId.set(row.id);
    this.currentAddress.set(row.name);
    this.showUnbindDialog = true;
  }

  unbindAddress() {
    this.api.fetch('/user_api/unbind_address', 'POST', { address_id: this.currentAddressId() }).subscribe({
      next: () => {
        this.showMessage(this.t()('success'));
        this.showUnbindDialog = false;
        this.fetchAddressData();
      },
      error: (err) => this.showMessage(err.message, true)
    });
  }

  openTransfer(row: any) {
    this.currentAddressId.set(row.id);
    this.currentAddress.set(row.name);
    this.targetUserEmail = '';
    this.showTransferDialog = true;
  }

  transferAddress() {
    if (!this.targetUserEmail) {
      this.showMessage(this.t()('targetUserEmail') + ' required', true);
      return;
    }
    this.api.fetch('/user_api/transfer_address', 'POST', {
      address_id: this.currentAddressId(),
      target_user_email: this.targetUserEmail
    }).subscribe({
      next: () => {
        this.showMessage(this.t()('success'));
        this.showTransferDialog = false;
        this.fetchAddressData();
      },
      error: (err) => this.showMessage(err.message, true)
    });
  }

  // User Mail Box
  queryMail() {
    this.mailBoxKey.set(Date.now());
  }

  fetchUserMailData(limit: number, offset: number) {
    let url = `/user_api/mails?limit=${limit}&offset=${offset}`;
    if (this.addressFilter) url += `&address=${this.addressFilter}`;
    return this.api.fetch<any>(url);
  }

  deleteUserMail(mailId: number) {
    return this.api.fetch(`/user_api/mails/${mailId}`, 'DELETE');
  }

  // Passkey Management
  showPasskeyList() {
    this.api.fetch<any[]>('/user_api/passkey').subscribe({
      next: (data) => {
        this.passkeyData.set(data || []);
        this.showPasskeyListDialog = true;
      },
      error: (err) => this.showMessage(err.message, true)
    });
  }

  createPasskey() {
    // Note: WebAuthn implementation would require @simplewebauthn/browser
    // For now, show a placeholder message
    this.showMessage('Passkey creation requires WebAuthn support', true);
    this.showCreatePasskeyDialog = false;
  }

  openRenamePasskey(row: any) {
    this.currentPasskeyId.set(row.passkey_id);
    this.currentPasskeyName = '';
    this.showRenamePasskeyDialog = true;
  }

  renamePasskey() {
    this.api.fetch('/user_api/passkey/rename', 'POST', {
      passkey_name: this.currentPasskeyName,
      passkey_id: this.currentPasskeyId()
    }).subscribe({
      next: () => {
        this.showMessage(this.t()('success'));
        this.showRenamePasskeyDialog = false;
        this.showPasskeyList();
      },
      error: (err) => this.showMessage(err.message, true)
    });
  }

  openDeletePasskey(row: any) {
    this.currentPasskeyId.set(row.passkey_id);
    this.showDeletePasskeyDialog = true;
  }

  deletePasskey() {
    this.api.fetch(`/user_api/passkey/${this.currentPasskeyId()}`, 'DELETE').subscribe({
      next: () => {
        this.showMessage(this.t()('success'));
        this.showDeletePasskeyDialog = false;
        this.showPasskeyList();
      },
      error: (err) => this.showMessage(err.message, true)
    });
  }

  logout() {
    this.state.setUserJwt('');
    this.showLogoutDialog = false;
    window.location.reload();
  }

  private showMessage(msg: string, isError = false) {
    this.snackBar.open(msg, '', {
      duration: 3000,
      panelClass: isError ? 'error-snackbar' : 'success-snackbar'
    });
  }
}
