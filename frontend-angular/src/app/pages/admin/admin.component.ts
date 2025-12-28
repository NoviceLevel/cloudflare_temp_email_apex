import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { LoadingComponent } from '../../components/loading/loading.component';
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

interface NavItem {
  id: string;
  icon: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatIconModule, TranslateModule, MatDialogModule, MatTooltipModule, LoadingComponent,
    AdminAccountComponent, AdminMailsComponent, AdminStatisticsComponent,
    AppearanceComponent, AboutComponent, CreateAccountComponent, AdminAccountSettingsComponent,
    UserManagementComponent, AdminUserSettingsComponent, MailsUnknowComponent,
    AdminSendboxComponent, AdminSendMailComponent, MailWebhookComponent, AdminTelegramComponent,
    MaintenanceComponent, DatabaseManagerComponent, WorkerConfigComponent,
    IpBlacklistSettingsComponent, AiExtractSettingsComponent, SenderAccessComponent,
    AdminUserOauth2SettingsComponent, AdminRoleAddressConfigComponent, AdminWebhookSettingsComponent,
  ],
  template: `
    @if (!state.openSettings().fetched) {
      <app-loading [fullscreen]="true" text="加载中..."></app-loading>
    } @else if (showAdminPasswordModal()) {
      <div class="password-page">
        <div class="password-card">
          <div class="password-icon">
            <mat-icon>admin_panel_settings</mat-icon>
          </div>
          <h1>管理员验证</h1>
          <p>请输入管理员密码以访问管理控制台</p>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>密码</mat-label>
            <input matInput [(ngModel)]="adminPassword" [type]="showPassword ? 'text' : 'password'" (keyup.enter)="submitPassword()">
            <button mat-icon-button matSuffix (click)="showPassword = !showPassword" type="button">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>
          <button mat-raised-button color="primary" class="submit-btn" (click)="submitPassword()">确认</button>
          <button mat-button class="back-btn" (click)="goHome()">返回首页</button>
        </div>
      </div>
    } @else {
      <div class="admin-page">
        <!-- Mobile Sidebar Overlay -->
        <div class="sidebar-overlay" [class.show]="sidebarOpen()" (click)="sidebarOpen.set(false)"></div>

        <!-- Header -->
        <header class="admin-header">
          <button class="menu-btn" (click)="sidebarOpen.set(true)">
            <mat-icon>menu</mat-icon>
          </button>
          <div class="header-title">管理控制台</div>
          <div class="header-actions">
            <button class="header-btn" (click)="goHome()" matTooltip="返回首页">
              <mat-icon>home</mat-icon>
            </button>
          </div>
        </header>

        <div class="admin-body">
          <!-- Left Sidebar -->
          <nav class="sidebar" [class.open]="sidebarOpen()">
            <div class="sidebar-header">
              <span>导航菜单</span>
              <button class="close-btn" (click)="sidebarOpen.set(false)">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            @for (item of navItems; track item.id) {
              <button class="nav-item" [class.active]="currentView() === item.id" (click)="currentView.set(item.id); sidebarOpen.set(false)">
                <span class="nav-icon" [style.background]="item.color">
                  <mat-icon>{{ item.icon }}</mat-icon>
                </span>
                <span class="nav-label">{{ item.label }}</span>
              </button>
            }
          </nav>

          <!-- Main Content -->
          <main class="main-content">
            <div class="content-wrapper">
              @switch (currentView()) {
                @case ('home') {
                  <div class="home-view">
                    <div class="welcome-section">
                      <div class="welcome-icons">
                        <span class="welcome-icon" style="background: #4285f4;"><mat-icon>settings</mat-icon></span>
                        <span class="welcome-icon" style="background: #34a853;"><mat-icon>security</mat-icon></span>
                        <span class="welcome-icon large" style="background: #ea4335;"><mat-icon>admin_panel_settings</mat-icon></span>
                        <span class="welcome-icon" style="background: #fbbc04;"><mat-icon>email</mat-icon></span>
                        <span class="welcome-icon" style="background: #9c27b0;"><mat-icon>people</mat-icon></span>
                      </div>
                      <h1 class="welcome-title">临时邮箱管理</h1>
                      <p class="welcome-subtitle">管理您的邮箱服务</p>
                    </div>

                    <div class="search-box">
                      <mat-icon>search</mat-icon>
                      <input type="text" placeholder="搜索管理功能" class="search-input">
                    </div>

                    <div class="quick-actions">
                      @for (item of navItems.slice(1, 6); track item.id) {
                        <button class="quick-btn" (click)="currentView.set(item.id)">{{ item.label }}</button>
                      }
                    </div>
                  </div>
                }
                @case ('account-settings') { <app-admin-account-settings></app-admin-account-settings> }
                @case ('user-settings') { <app-admin-user-settings></app-admin-user-settings> }
                @case ('accounts') { <app-admin-account></app-admin-account> }
                @case ('create-account') { <app-create-account></app-create-account> }
                @case ('sender-access') { <app-sender-access></app-sender-access> }
                @case ('users') { <app-user-management></app-user-management> }
                @case ('oauth2') { <app-admin-user-oauth2-settings></app-admin-user-oauth2-settings> }
                @case ('role-address') { <app-admin-role-address-config></app-admin-role-address-config> }
                @case ('mails') { <app-admin-mails></app-admin-mails> }
                @case ('unknown-mails') { <app-mails-unknow></app-mails-unknow> }
                @case ('sendbox') { <app-admin-sendbox></app-admin-sendbox> }
                @case ('send-mail') { <app-admin-send-mail></app-admin-send-mail> }
                @case ('webhook') { <app-mail-webhook></app-mail-webhook> }
                @case ('telegram') { <app-admin-telegram></app-admin-telegram> }
                @case ('statistics') { <app-admin-statistics></app-admin-statistics> }
                @case ('database') { <app-database-manager></app-database-manager> }
                @case ('cleanup') { <app-maintenance></app-maintenance> }
                @case ('worker-config') { <app-worker-config></app-worker-config> }
                @case ('ip-blacklist') { <app-ip-blacklist-settings></app-ip-blacklist-settings> }
                @case ('ai-extract') { <app-ai-extract-settings></app-ai-extract-settings> }
                @case ('webhook-settings') { <app-admin-webhook-settings></app-admin-webhook-settings> }
                @case ('appearance') { <app-appearance [showUseSimpleIndex]="true"></app-appearance> }
                @case ('about') { <app-about></app-about> }
              }
            </div>
          </main>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-page{min-height:100vh;background:#f8f9fa}
    .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:998;opacity:0;pointer-events:none}
    .sidebar-overlay.show{opacity:1;pointer-events:auto}
    .admin-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #e0e0e0;position:sticky;top:0;z-index:100}
    .menu-btn,.header-btn,.close-btn{width:40px;height:40px;border:none;background:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#5f6368}
    .menu-btn{display:none;margin-right:8px}
    .header-title{font-size:20px;color:#5f6368;flex:1}
    .header-actions{display:flex;gap:8px}
    .admin-body{display:flex;min-height:calc(100vh - 57px)}
    .sidebar{width:280px;background:#fff;padding:8px 12px;flex-shrink:0;border-right:1px solid #e0e0e0;overflow-y:auto}
    .sidebar-header{display:none;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #e0e0e0;margin:-8px -12px 8px;font-weight:500;color:#202124}
    .nav-item{display:flex;align-items:center;width:100%;padding:12px 16px;border:none;background:none;border-radius:28px;cursor:pointer;gap:16px;margin-bottom:4px}
    .nav-item:hover{background:#f1f3f4}
    .nav-item.active{background:#e8f0fe}
    .nav-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
    .nav-icon mat-icon{font-size:18px;width:18px;height:18px;color:#fff}
    .nav-label{font-size:14px;color:#202124;font-weight:500}
    .nav-item.active .nav-label{color:#1a73e8}
    .main-content{flex:1;padding:24px 48px;overflow-y:auto}
    .content-wrapper{max-width:900px;margin:0 auto}
    .home-view{text-align:center;padding-top:40px}
    .welcome-section{margin-bottom:32px}
    .welcome-icons{display:flex;justify-content:center;align-items:center;gap:8px;margin-bottom:24px}
    .welcome-icon{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center}
    .welcome-icon.large{width:72px;height:72px}
    .welcome-icon mat-icon{color:#fff;font-size:24px;width:24px;height:24px}
    .welcome-icon.large mat-icon{font-size:36px;width:36px;height:36px}
    .welcome-title{font-size:36px;font-weight:400;color:#202124;margin:0 0 8px}
    .welcome-subtitle{font-size:16px;color:#5f6368;margin:0}
    .search-box{display:flex;align-items:center;max-width:600px;margin:0 auto 32px;padding:12px 20px;background:#fff;border:1px solid #dfe1e5;border-radius:24px}
    .search-box mat-icon{color:#9aa0a6;margin-right:12px}
    .search-input{flex:1;border:none;outline:none;font-size:16px;background:transparent;color:#202124}
    .quick-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}
    .quick-btn{padding:8px 16px;border:1px solid #dadce0;border-radius:8px;background:#fff;font-size:14px;color:#3c4043;cursor:pointer}
    .quick-btn:hover{border-color:#1a73e8;color:#1a73e8}
    .password-page{display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f8f9fa;padding:24px}
    .password-card{background:#fff;border-radius:12px;padding:48px;text-align:center;max-width:400px;width:100%;box-shadow:0 1px 3px rgba(0,0,0,.1)}
    .password-icon{width:80px;height:80px;border-radius:50%;background:#e8f0fe;color:#1a73e8;display:flex;align-items:center;justify-content:center;margin:0 auto 24px}
    .password-icon mat-icon{font-size:40px;width:40px;height:40px}
    .password-card h1{font-size:24px;font-weight:400;color:#202124;margin:0 0 8px}
    .password-card p{font-size:14px;color:#5f6368;margin:0 0 24px}
    .full-width{width:100%}
    .submit-btn,.back-btn{width:100%;margin-top:8px}
    @media(max-width:900px){.sidebar{width:72px;padding:8px}.sidebar-header{display:none}.nav-label{display:none}.nav-item{justify-content:center;padding:12px}.main-content{padding:20px}}
    @media(max-width:600px){.menu-btn{display:flex}.sidebar-overlay{display:block}.sidebar{position:fixed;inset:0;right:auto;width:280px;z-index:999;transform:translateX(-100%);transition:transform .3s}.sidebar.open{transform:none}.sidebar-header{display:flex}.nav-label{display:block}.nav-item{justify-content:flex-start;padding:12px 16px}.main-content{padding:16px}.home-view{padding-top:20px}.welcome-icons{gap:4px}.welcome-icon{width:36px;height:36px}.welcome-icon.large{width:56px;height:56px}.welcome-icon mat-icon{font-size:18px;width:18px;height:18px}.welcome-icon.large mat-icon{font-size:28px;width:28px;height:28px}.welcome-title{font-size:24px}.welcome-subtitle{font-size:14px}.search-box{padding:10px 16px;margin-bottom:24px}.search-input{font-size:14px}.quick-actions{gap:8px}.quick-btn{padding:8px 12px;font-size:12px}.password-card{padding:32px 24px}.password-icon{width:64px;height:64px}.password-icon mat-icon{font-size:32px;width:32px;height:32px}.password-card h1{font-size:20px}}
  `]
})
export class AdminComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private dialog = inject(MatDialog);

  currentView = signal('home');
  sidebarOpen = signal(false);
  adminPassword = '';
  showPassword = false;

  navItems: NavItem[] = [
    { id: 'home', icon: 'home', label: '首页', color: '#4285f4' },
    { id: 'account-settings', icon: 'tune', label: '账号设置', color: '#34a853' },
    { id: 'user-settings', icon: 'person', label: '用户设置', color: '#ea4335' },
    { id: 'accounts', icon: 'manage_accounts', label: '账号管理', color: '#fbbc04' },
    { id: 'users', icon: 'people', label: '用户管理', color: '#9c27b0' },
    { id: 'mails', icon: 'email', label: '邮件管理', color: '#00bcd4' },
    { id: 'statistics', icon: 'bar_chart', label: '统计数据', color: '#ff5722' },
    { id: 'database', icon: 'storage', label: '数据库', color: '#607d8b' },
    { id: 'cleanup', icon: 'cleaning_services', label: '数据清理', color: '#795548' },
    { id: 'appearance', icon: 'palette', label: '外观设置', color: '#e91e63' },
    { id: 'about', icon: 'info', label: '关于', color: '#9e9e9e' },
  ];

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
  }

  goHome() { window.location.href = '/'; }

  submitPassword() {
    if (this.adminPassword) {
      this.state.setAdminAuth(this.adminPassword);
      location.reload();
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

@Component({
  selector: 'app-admin-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>管理员密码</h2>
    <mat-dialog-content>
      <p class="hint">请输入管理员密码以继续</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>密码</mat-label>
        <input matInput [(ngModel)]="password" [type]="showPassword ? 'text' : 'password'" (keyup.enter)="submit()">
        <button mat-icon-button matSuffix (click)="showPassword = !showPassword" type="button">
          <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="submit()">确认</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; } .hint { margin-bottom: 16px; color: #5f6368; }`]
})
export class AdminPasswordDialogComponent {
  private dialogRef = inject(MatDialogRef<AdminPasswordDialogComponent>);
  password = '';
  showPassword = false;
  submit() { this.dialogRef.close(this.password); }
}
