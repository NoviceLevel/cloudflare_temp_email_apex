import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { AdminAccountComponent } from '../../views/admin/account/account.component';
import { AdminMailsComponent } from '../../views/admin/mails/mails.component';
import { AdminStatisticsComponent } from '../../views/admin/statistics/statistics.component';
import { AppearanceComponent } from '../../views/common/appearance/appearance.component';
import { AboutComponent } from '../../views/common/about/about.component';
import { CreateAccountComponent } from '../../views/admin/create-account/create-account.component';
import { AdminAccountSettingsComponent } from '../../views/admin/account-settings/account-settings.component';
import { UserManagementComponent } from '../../views/admin/user-management/user-management.component';
import { AdminUserSettingsComponent } from '../../views/admin/user-settings/user-settings.component';
import { MailsUnknowComponent } from '../../views/admin/mails-unknow/mails-unknow.component';
import { AdminSendboxComponent } from '../../views/admin/sendbox/sendbox.component';
import { AdminSendMailComponent } from '../../views/admin/send-mail/send-mail.component';
import { MailWebhookComponent } from '../../views/admin/mail-webhook/mail-webhook.component';
import { AdminTelegramComponent } from '../../views/admin/telegram/telegram.component';
import { MaintenanceComponent } from '../../views/admin/maintenance/maintenance.component';
import { DatabaseManagerComponent } from '../../views/admin/database-manager/database-manager.component';
import { WorkerConfigComponent } from '../../views/admin/worker-config/worker-config.component';
import { IpBlacklistSettingsComponent } from '../../views/admin/ip-blacklist-settings/ip-blacklist-settings.component';
import { AiExtractSettingsComponent } from '../../views/admin/ai-extract-settings/ai-extract-settings.component';
import { SenderAccessComponent } from '../../views/admin/sender-access/sender-access.component';
import { AdminUserOauth2SettingsComponent } from '../../views/admin/user-oauth2-settings/user-oauth2-settings.component';
import { AdminRoleAddressConfigComponent } from '../../views/admin/role-address-config/role-address-config.component';
import { AdminWebhookSettingsComponent } from '../../views/admin/webhook-settings/webhook-settings.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    MatDialogModule,
    AdminAccountComponent,
    AdminMailsComponent,
    AdminStatisticsComponent,
    AppearanceComponent,
    AboutComponent,
    CreateAccountComponent,
    AdminAccountSettingsComponent,
    UserManagementComponent,
    AdminUserSettingsComponent,
    MailsUnknowComponent,
    AdminSendboxComponent,
    AdminSendMailComponent,
    MailWebhookComponent,
    AdminTelegramComponent,
    MaintenanceComponent,
    DatabaseManagerComponent,
    WorkerConfigComponent,
    IpBlacklistSettingsComponent,
    AiExtractSettingsComponent,
    SenderAccessComponent,
    AdminUserOauth2SettingsComponent,
    AdminRoleAddressConfigComponent,
    AdminWebhookSettingsComponent,
  ],
  template: `
    @if (state.openSettings().fetched) {
        <div class="admin-container">
          <!-- Main Tabs -->
          <mat-tab-group [(selectedIndex)]="mainTab" color="primary" animationDuration="0ms">
            <!-- 快速设置 -->
            <mat-tab [label]="'quickSetup' | translate">
              <div class="tab-content">
                <mat-tab-group [(selectedIndex)]="quickSetupTab" color="primary">
                  <mat-tab [label]="'accountSettings' | translate">
                    <div class="sub-tab-content">
                      <app-admin-account-settings></app-admin-account-settings>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'userSettings' | translate">
                    <div class="sub-tab-content">
                      <app-admin-user-settings></app-admin-user-settings>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </div>
            </mat-tab>

            <!-- 账号 -->
            <mat-tab [label]="'account' | translate">
              <div class="tab-content">
                <mat-tab-group [(selectedIndex)]="accountTab" color="primary">
                  <mat-tab [label]="'accountList' | translate">
                    <div class="sub-tab-content">
                      <app-admin-account></app-admin-account>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'createAccount' | translate">
                    <div class="sub-tab-content">
                      <app-create-account></app-create-account>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'senderAccess' | translate">
                    <div class="sub-tab-content">
                      <app-sender-access></app-sender-access>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </div>
            </mat-tab>

            <!-- 用户 -->
            <mat-tab [label]="'user' | translate">
              <div class="tab-content">
                <mat-tab-group [(selectedIndex)]="userTab" color="primary">
                  <mat-tab [label]="'userManagement' | translate">
                    <div class="sub-tab-content">
                      <app-user-management></app-user-management>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'userSettings' | translate">
                    <div class="sub-tab-content">
                      <app-admin-user-settings></app-admin-user-settings>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'oauth2Settings' | translate">
                    <div class="sub-tab-content">
                      <app-admin-user-oauth2-settings></app-admin-user-oauth2-settings>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'roleAddressConfig' | translate">
                    <div class="sub-tab-content">
                      <app-admin-role-address-config></app-admin-role-address-config>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </div>
            </mat-tab>

            <!-- 邮件 -->
            <mat-tab [label]="'mails' | translate">
              <div class="tab-content">
                <mat-tab-group [(selectedIndex)]="mailsTab" color="primary">
                  <mat-tab [label]="'mailList' | translate">
                    <div class="sub-tab-content">
                      <app-admin-mails></app-admin-mails>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'unknownMails' | translate">
                    <div class="sub-tab-content">
                      <app-mails-unknow></app-mails-unknow>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'sendbox' | translate">
                    <div class="sub-tab-content">
                      <app-admin-sendbox></app-admin-sendbox>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'sendMail' | translate">
                    <div class="sub-tab-content">
                      <app-admin-send-mail></app-admin-send-mail>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'mailWebhook' | translate">
                    <div class="sub-tab-content">
                      <app-mail-webhook></app-mail-webhook>
                    </div>
                  </mat-tab>
                  <mat-tab label="Telegram">
                    <div class="sub-tab-content">
                      <app-admin-telegram></app-admin-telegram>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </div>
            </mat-tab>

            <!-- 统计 -->
            <mat-tab [label]="'statistics' | translate">
              <div class="tab-content">
                <app-admin-statistics></app-admin-statistics>
              </div>
            </mat-tab>

            <!-- 维护 -->
            <mat-tab [label]="'maintenance' | translate">
              <div class="tab-content">
                <mat-tab-group [(selectedIndex)]="maintenanceTab" color="primary">
                  <mat-tab [label]="'database' | translate">
                    <div class="sub-tab-content">
                      <app-database-manager></app-database-manager>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'cleanup' | translate">
                    <div class="sub-tab-content">
                      <app-maintenance></app-maintenance>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'workerConfig' | translate">
                    <div class="sub-tab-content">
                      <app-worker-config></app-worker-config>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'ipBlacklist' | translate">
                    <div class="sub-tab-content">
                      <app-ip-blacklist-settings></app-ip-blacklist-settings>
                    </div>
                  </mat-tab>
                  <mat-tab [label]="'aiExtract' | translate">
                    <div class="sub-tab-content">
                      <app-ai-extract-settings></app-ai-extract-settings>
                    </div>
                  </mat-tab>
                  <mat-tab label="Webhook">
                    <div class="sub-tab-content">
                      <app-admin-webhook-settings></app-admin-webhook-settings>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </div>
            </mat-tab>

            <!-- 外观 -->
            <mat-tab [label]="'appearance' | translate">
              <div class="tab-content">
                <app-appearance [showUseSimpleIndex]="true"></app-appearance>
              </div>
            </mat-tab>

            <!-- 关于 -->
            <mat-tab [label]="'about' | translate">
              <div class="tab-content">
                <app-about></app-about>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
    } @else {
      <div class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    }
  `,
  styles: [`
    .admin-container { padding: 16px; }
    .tab-content { padding: 16px; }
    .sub-tab-content { padding: 16px 0; }
    .loading-container { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class AdminComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);

  mainTab = 0;
  quickSetupTab = 0;
  accountTab = 0;
  userTab = 0;
  mailsTab = 0;
  maintenanceTab = 0;

  showAdminPasswordModal = computed(() => {
    const hasAdminAuth = !!this.state.adminAuth();
    const isAdmin = this.state.userSettings().is_admin;
    const disableCheck = this.state.openSettings().disableAdminPasswordCheck;
    if (hasAdminAuth || isAdmin || disableCheck) return false;
    return true;
  });

  async ngOnInit() {
    if (!this.state.openSettings().fetched) {
      await this.api.getOpenSettings();
    }
    if (!this.state.userSettings().user_id) {
      await this.api.getUserSettings();
    }
    // 检查是否需要显示密码对话框
    if (this.showAdminPasswordModal()) {
      this.openAdminPasswordDialog();
    }
  }

  openAdminPasswordDialog() {
    const dialogRef = this.dialog.open(AdminPasswordDialogComponent, {
      width: '400px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(password => {
      if (password) {
        this.state.setAdminAuth(password);
        location.reload();
      }
    });
  }
}

// Admin Password Dialog
@Component({
  selector: 'app-admin-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'adminPassword' | translate }}</h2>
    <mat-dialog-content>
      <p class="mb-3">{{ 'enterAdminPassword' | translate }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'password' | translate }}</mat-label>
        <input matInput [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" (keyup.enter)="submit()">
        <button mat-icon-button matSuffix (click)="showPassword = !showPassword" type="button">
          <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="submit()">{{ 'confirm' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; } .mb-3 { margin-bottom: 12px; }`]
})
export class AdminPasswordDialogComponent {
  private dialogRef = inject(MatDialogRef<AdminPasswordDialogComponent>);
  password = '';
  showPassword = false;

  submit() {
    this.dialogRef.close(this.password);
  }
}
