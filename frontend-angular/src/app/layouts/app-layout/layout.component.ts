import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';

import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { UserLoginComponent } from '../../views/user/user-login/user-login.component';
import { AddressManagementComponent } from '../../views/user/address-management/address-management.component';
import { UserSettingsComponent } from '../../views/user/user-settings/user-settings.component';
import { UserMailboxComponent } from '../../views/user/user-mailbox/user-mailbox.component';
import { BindAddressComponent } from '../../views/user/bind-address/bind-address.component';
import { InboxComponent } from '../../components/inbox/inbox.component';
import { LoadingComponent } from '../../components/loading/loading.component';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  route?: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatMenuModule, MatTooltipModule,
    MatDividerModule, MatDialogModule, MatSelectModule,
    MatTabsModule, TranslateModule,
    UserLoginComponent, AddressManagementComponent, UserSettingsComponent,
    UserMailboxComponent, BindAddressComponent, InboxComponent, LoadingComponent,
  ],
  template: `
    <div class="app-page" [class.dark]="state.isDark()">
      <!-- Mobile Sidebar Overlay -->
      <div class="sidebar-overlay" [class.show]="sidebarOpen()" (click)="sidebarOpen.set(false)"></div>

      <!-- Header -->
      <header class="app-header">
        <button class="menu-btn" (click)="sidebarOpen.set(true)">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="header-title">临时邮箱</div>
        <div class="header-actions">
          <button class="header-btn" (click)="toggleTheme()" [matTooltip]="state.isDark() ? '浅色模式' : '深色模式'">
            <mat-icon>{{ state.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>
          <button class="header-btn" (click)="currentView.set('user'); loadUserSettings()" matTooltip="用户登录">
            <mat-icon>person</mat-icon>
          </button>
          <button class="header-btn" *ngIf="state.showAdminPage()" (click)="goAdmin()" matTooltip="管理后台">
            <mat-icon>admin_panel_settings</mat-icon>
          </button>
        </div>
      </header>

      <div class="app-body">
        <!-- Left Sidebar -->
        <nav class="sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-header">
            <span>导航菜单</span>
            <button class="close-btn" (click)="sidebarOpen.set(false)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          @for (item of navItems; track item.id) {
            <button class="nav-item" [class.active]="currentView() === item.id" (click)="selectNav(item); sidebarOpen.set(false)">
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
                  <!-- Welcome Section -->
                  <div class="welcome-section">
                    <div class="welcome-icons">
                      <span class="welcome-icon" style="background: #4285f4;"><mat-icon>mail</mat-icon></span>
                      <span class="welcome-icon" style="background: #34a853;"><mat-icon>verified</mat-icon></span>
                      <span class="welcome-icon large">
                        <div class="avatar-large">{{ getInitial() }}</div>
                      </span>
                      <span class="welcome-icon" style="background: #fbbc04;"><mat-icon>schedule</mat-icon></span>
                      <span class="welcome-icon" style="background: #ea4335;"><mat-icon>security</mat-icon></span>
                    </div>
                    <h1 class="welcome-title">{{ state.settings().address || '临时邮箱' }}</h1>
                    <p class="welcome-subtitle">您的临时邮箱地址</p>
                  </div>

                  <!-- Search Box -->
                  <div class="search-box">
                    <mat-icon>search</mat-icon>
                    <input type="text" [(ngModel)]="searchQuery" placeholder="搜索邮件" (keyup.enter)="searchMails()">
                  </div>

                  <!-- Quick Actions -->
                  <div class="quick-actions">
                    <button class="quick-btn" (click)="copyAddress()">
                      <mat-icon>content_copy</mat-icon>复制地址
                    </button>
                    <button class="quick-btn" (click)="currentView.set('inbox')">
                      <mat-icon>inbox</mat-icon>收件箱
                    </button>
                    <button class="quick-btn" (click)="newAddress()">
                      <mat-icon>add</mat-icon>新建地址
                    </button>
                    <button class="quick-btn" (click)="refresh()">
                      <mat-icon>refresh</mat-icon>刷新
                    </button>
                  </div>

                  <!-- Stats Cards -->
                  <div class="stats-section">
                    <div class="stat-card" (click)="currentView.set('inbox')">
                      <div class="stat-icon" style="background: #e8f0fe; color: #1a73e8;">
                        <mat-icon>email</mat-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ mailCount() }}</div>
                        <div class="stat-label">封邮件</div>
                      </div>
                    </div>
                    <div class="stat-card" (click)="currentView.set('addresses')">
                      <div class="stat-icon" style="background: #e6f4ea; color: #137333;">
                        <mat-icon>alternate_email</mat-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ state.savedAddresses().length }}</div>
                        <div class="stat-label">个地址</div>
                      </div>
                    </div>
                  </div>

                  <!-- Recent Mails Preview -->
                  @if (recentMails().length > 0) {
                    <div class="recent-section">
                      <div class="section-title">最近邮件</div>
                      <div class="recent-list">
                        @for (mail of recentMails().slice(0, 3); track mail.id) {
                          <div class="recent-item" (click)="openMail(mail)">
                            <div class="recent-avatar">{{ getMailInitial(mail.source) }}</div>
                            <div class="recent-content">
                              <div class="recent-sender">{{ getMailSender(mail.source) }}</div>
                              <div class="recent-subject">{{ mail.subject || '(无主题)' }}</div>
                            </div>
                            <div class="recent-time">{{ formatTime(mail.created_at) }}</div>
                          </div>
                        }
                      </div>
                      <button class="view-all-btn" (click)="currentView.set('inbox')">查看全部邮件</button>
                    </div>
                  }
                </div>
              }
              @case ('inbox') {
                <app-inbox></app-inbox>
              }
              @case ('addresses') {
                <div class="addresses-view">
                  <div class="view-header">
                    <h2>我的邮箱地址</h2>
                    <button mat-raised-button color="primary" (click)="newAddress()">
                      <mat-icon>add</mat-icon>新建地址
                    </button>
                  </div>
                  <div class="address-grid">
                    @for (addr of state.savedAddresses(); track addr.address) {
                      <div class="address-card" [class.active]="addr.address === state.settings().address">
                        <div class="address-avatar">{{ addr.address.charAt(0).toUpperCase() }}</div>
                        <div class="address-info">
                          <div class="address-text">{{ addr.address }}</div>
                          <div class="address-status">{{ addr.address === state.settings().address ? '当前使用' : '点击切换' }}</div>
                        </div>
                        <div class="address-actions">
                          <button mat-icon-button (click)="copyAddr(addr.address)" matTooltip="复制">
                            <mat-icon>content_copy</mat-icon>
                          </button>
                          <button mat-icon-button (click)="switchAddress(addr.address)" matTooltip="切换" *ngIf="addr.address !== state.settings().address">
                            <mat-icon>swap_horiz</mat-icon>
                          </button>
                          <button mat-icon-button (click)="deleteAddress(addr.address)" matTooltip="删除" color="warn">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
              @case ('settings') {
                <div class="settings-view">
                  <h2>设置</h2>
                  <div class="setting-card">
                    <div class="setting-item">
                      <div class="setting-info">
                        <div class="setting-title">深色模式</div>
                        <div class="setting-desc">切换深色/浅色主题</div>
                      </div>
                      <button mat-stroked-button (click)="toggleTheme()">
                        {{ state.isDark() ? '切换浅色' : '切换深色' }}
                      </button>
                    </div>
                  </div>
                </div>
              }
              @case ('user') {
                <div class="user-view">
                  @if (!state.userSettings().fetched) {
                    <app-loading text="加载中..."></app-loading>
                  } @else if (state.userSettings().user_email) {
                    <div class="user-logged-in">
                      <div class="user-info-card">
                        <div class="user-avatar">{{ state.userSettings().user_email.charAt(0).toUpperCase() }}</div>
                        <div class="user-details">
                          <div class="user-email">{{ state.userSettings().user_email }}</div>
                          <div class="user-status">已登录</div>
                        </div>
                      </div>
                      <mat-tab-group color="primary">
                        <mat-tab label="地址管理">
                          <div class="tab-content"><app-address-management></app-address-management></div>
                        </mat-tab>
                        <mat-tab label="收件箱">
                          <div class="tab-content"><app-user-mailbox></app-user-mailbox></div>
                        </mat-tab>
                        <mat-tab label="用户设置">
                          <div class="tab-content"><app-user-settings></app-user-settings></div>
                        </mat-tab>
                        <mat-tab label="绑定地址">
                          <div class="tab-content"><app-bind-address></app-bind-address></div>
                        </mat-tab>
                      </mat-tab-group>
                    </div>
                  } @else {
                    <div class="login-section">
                      <h2>用户登录</h2>
                      <p class="login-hint">登录后可以管理多个邮箱地址</p>
                      @if (state.userJwt()) {
                        <div class="warning-alert">
                          <mat-icon>warning</mat-icon>
                          <span>登录信息已过期，请重新登录</span>
                        </div>
                      }
                      <div class="login-card">
                        <app-user-login></app-user-login>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </main>
      </div>

      <!-- Mobile Bottom Navigation -->
      <nav class="bottom-nav">
        @for (item of navItems.slice(0, 4); track item.id) {
          <button class="bottom-nav-item" [class.active]="currentView() === item.id" (click)="selectNav(item)">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </button>
        }
      </nav>
    </div>
  `,
  styles: [`
    .app-page{min-height:100vh;background:#f8f9fa}
    .app-page.dark{background:#202124}
    .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:998;opacity:0;pointer-events:none}
    .sidebar-overlay.show{opacity:1;pointer-events:auto}
    .app-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#fff;border-bottom:1px solid #e0e0e0;position:sticky;top:0;z-index:100}
    .dark .app-header{background:#202124;border-color:#5f6368}
    .menu-btn,.header-btn,.close-btn{width:40px;height:40px;border:none;background:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#5f6368}
    .dark .menu-btn,.dark .header-btn,.dark .close-btn{color:#9aa0a6}
    .menu-btn{display:none;margin-right:8px}
    .header-title{font-size:20px;color:#5f6368;flex:1}
    .dark .header-title{color:#e8eaed}
    .header-actions{display:flex;gap:4px}
    .app-body{display:flex;min-height:calc(100vh - 57px)}
    .sidebar{width:280px;background:#fff;padding:8px 12px;border-right:1px solid #e0e0e0}
    .dark .sidebar{background:#202124;border-color:#5f6368}
    .sidebar-header{display:none;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #e0e0e0;margin:-8px -12px 8px;font-weight:500;color:#202124}
    .dark .sidebar-header{border-color:#5f6368;color:#e8eaed}
    .nav-item{display:flex;align-items:center;width:100%;padding:12px 16px;border:none;background:none;border-radius:28px;cursor:pointer;gap:16px;margin-bottom:4px;color:#202124}
    .dark .nav-item{color:#e8eaed}
    .nav-item:hover{background:#f1f3f4}
    .dark .nav-item:hover{background:#3c4043}
    .nav-item.active{background:#e8f0fe}
    .dark .nav-item.active{background:#394457}
    .nav-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center}
    .nav-icon mat-icon{font-size:18px;width:18px;height:18px;color:#fff}
    .nav-label{font-size:14px;font-weight:500}
    .nav-item.active .nav-label{color:#1a73e8}
    .dark .nav-item.active .nav-label{color:#8ab4f8}
    .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #e0e0e0;padding:8px 0;z-index:100}
    .dark .bottom-nav{background:#202124;border-color:#5f6368}
    .bottom-nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:none;background:none;cursor:pointer;color:#5f6368;font-size:11px}
    .dark .bottom-nav-item{color:#9aa0a6}
    .bottom-nav-item.active{color:#1a73e8}
    .dark .bottom-nav-item.active{color:#8ab4f8}
    .main-content{flex:1;padding:24px 48px;overflow-y:auto}
    .content-wrapper{max-width:900px;margin:0 auto}
    .home-view{text-align:center;padding-top:20px}
    .welcome-section{margin-bottom:32px}
    .welcome-icons{display:flex;justify-content:center;gap:8px;margin-bottom:24px}
    .welcome-icon{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center}
    .welcome-icon.large{width:80px;height:80px}
    .welcome-icon mat-icon{color:#fff;font-size:24px;width:24px;height:24px}
    .avatar-large{width:80px;height:80px;border-radius:50%;background:#1a73e8;color:#fff;display:flex;align-items:center;justify-content:center;font-size:36px}
    .dark .avatar-large{background:#8ab4f8;color:#202124}
    .welcome-title{font-size:28px;margin:0 0 8px;word-break:break-all;color:#202124}
    .dark .welcome-title{color:#e8eaed}
    .welcome-subtitle{color:#5f6368;margin:0}
    .dark .welcome-subtitle{color:#9aa0a6}
    .search-box{display:flex;align-items:center;max-width:600px;margin:0 auto 32px;padding:12px 20px;background:#fff;border:1px solid #dfe1e5;border-radius:24px}
    .dark .search-box{background:#303134;border-color:#5f6368}
    .search-box mat-icon{color:#9aa0a6;margin-right:12px}
    .search-box input{flex:1;border:none;outline:none;font-size:16px;background:none;color:#202124}
    .dark .search-box input{color:#e8eaed}
    .quick-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-bottom:40px}
    .quick-btn{display:flex;align-items:center;gap:8px;padding:10px 20px;border:1px solid #dadce0;border-radius:8px;background:#fff;cursor:pointer;color:#3c4043}
    .dark .quick-btn{background:#303134;border-color:#5f6368;color:#e8eaed}
    .quick-btn:hover{border-color:#1a73e8;color:#1a73e8}
    .dark .quick-btn:hover{border-color:#8ab4f8;color:#8ab4f8}
    .stats-section{display:flex;justify-content:center;gap:24px;margin-bottom:40px}
    .stat-card{display:flex;align-items:center;gap:16px;padding:20px 32px;background:#fff;border:1px solid #dadce0;border-radius:12px;cursor:pointer}
    .dark .stat-card{background:#303134;border-color:#5f6368}
    .stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center}
    .stat-value{font-size:32px;font-weight:500;color:#202124}
    .dark .stat-value{color:#e8eaed}
    .stat-label{font-size:14px;color:#5f6368}
    .dark .stat-label{color:#9aa0a6}
    .recent-section{text-align:left;max-width:600px;margin:0 auto}
    .section-title{font-size:14px;color:#5f6368;margin-bottom:12px;text-transform:uppercase}
    .dark .section-title{color:#9aa0a6}
    .recent-list{background:#fff;border:1px solid #dadce0;border-radius:12px;overflow:hidden}
    .dark .recent-list{background:#303134;border-color:#5f6368}
    .recent-item{display:flex;align-items:center;gap:16px;padding:16px;border-bottom:1px solid #e0e0e0;cursor:pointer}
    .dark .recent-item{border-color:#5f6368}
    .recent-item:last-child{border:none}
    .recent-avatar,.address-avatar,.user-avatar{border-radius:50%;background:#1a73e8;color:#fff;display:flex;align-items:center;justify-content:center}
    .dark .recent-avatar,.dark .address-avatar{background:#8ab4f8;color:#202124}
    .recent-avatar{width:40px;height:40px}
    .recent-content,.address-info,.user-details{flex:1;min-width:0}
    .recent-sender{font-weight:500;color:#202124}
    .dark .recent-sender{color:#e8eaed}
    .recent-subject{font-size:13px;color:#5f6368;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dark .recent-subject{color:#9aa0a6}
    .recent-time{font-size:12px;color:#5f6368}
    .dark .recent-time{color:#9aa0a6}
    .view-all-btn{width:100%;padding:12px;border:none;background:none;color:#1a73e8;cursor:pointer}
    .dark .view-all-btn{color:#8ab4f8}
    .view-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px}
    .view-header h2,.settings-view h2{font-size:24px;margin:0;color:#202124}
    .dark .view-header h2,.dark .settings-view h2{color:#e8eaed}
    .settings-view h2{margin-bottom:24px}
    .address-grid{display:grid;gap:16px}
    .address-card{display:flex;align-items:center;gap:16px;padding:16px 20px;background:#fff;border:1px solid #dadce0;border-radius:12px}
    .dark .address-card{background:#303134;border-color:#5f6368}
    .address-card.active{border-color:#1a73e8;background:#e8f0fe}
    .dark .address-card.active{background:#394457;border-color:#8ab4f8}
    .address-avatar{width:48px;height:48px;font-size:20px}
    .address-text{font-weight:500;word-break:break-all;color:#202124}
    .dark .address-text{color:#e8eaed}
    .address-status{font-size:13px;color:#5f6368}
    .dark .address-status{color:#9aa0a6}
    .address-card.active .address-status{color:#1a73e8}
    .dark .address-card.active .address-status{color:#8ab4f8}
    .address-actions{display:flex;gap:4px}
    .setting-card{background:#fff;border:1px solid #dadce0;border-radius:12px}
    .dark .setting-card{background:#303134;border-color:#5f6368}
    .setting-item{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;gap:16px;flex-wrap:wrap}
    .setting-title{font-weight:500;color:#202124}
    .dark .setting-title{color:#e8eaed}
    .setting-desc{font-size:13px;color:#5f6368}
    .dark .setting-desc{color:#9aa0a6}
    .user-info-card{display:flex;align-items:center;gap:16px;padding:20px 24px;background:#e8f0fe;border-radius:12px;margin-bottom:24px}
    .dark .user-info-card{background:#303134}
    .user-avatar{width:56px;height:56px;font-size:24px}
    .user-email{font-size:18px;font-weight:500;word-break:break-all;color:#202124}
    .dark .user-email{color:#e8eaed}
    .user-status{color:#1a73e8}
    .dark .user-status{color:#8ab4f8}
    .tab-content{padding:16px 0}
    .login-section{text-align:center;max-width:500px;margin:0 auto}
    .login-section h2{font-size:28px;margin:0 0 8px;color:#202124}
    .dark .login-section h2{color:#e8eaed}
    .login-hint{color:#5f6368;margin:0 0 24px}
    .dark .login-hint{color:#9aa0a6}
    .warning-alert{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 16px;background:#fef7e0;border-radius:8px;color:#ea8600;margin-bottom:16px}
    .login-card{background:#fff;border:1px solid #dadce0;border-radius:12px;padding:24px;text-align:left}
    .dark .login-card{background:#303134;border-color:#5f6368}
    @media(max-width:900px){.sidebar{width:72px;padding:8px}.nav-label{display:none}.nav-item{justify-content:center;padding:12px}.main-content{padding:20px}.stats-section{flex-direction:column}}
    @media(max-width:600px){.app-body{padding-bottom:64px}.menu-btn{display:flex}.sidebar-overlay{display:block}.sidebar{position:fixed;inset:0;right:auto;width:280px;z-index:999;transform:translateX(-100%);transition:transform .3s}.sidebar.open{transform:none}.sidebar-header{display:flex}.nav-label{display:block}.nav-item{justify-content:flex-start;padding:12px 16px}.main-content{padding:16px}.bottom-nav{display:flex}.welcome-icon{width:36px;height:36px}.welcome-icon.large{width:56px;height:56px}.avatar-large{width:56px;height:56px;font-size:24px}.welcome-title{font-size:18px}.search-box{padding:10px 16px;margin-bottom:24px}.quick-btn{padding:8px 12px;font-size:12px}.stat-card{padding:16px}.stat-value{font-size:24px}.recent-item{padding:12px}.recent-avatar{width:36px;height:36px}.address-card{padding:12px;flex-wrap:wrap}.address-avatar{width:40px;height:40px}.address-actions{width:100%;justify-content:flex-end;margin-top:8px}.user-info-card{padding:16px}.user-avatar{width:48px;height:48px}.login-card{padding:16px}}
  `]
})
export class AppLayoutComponent implements OnInit {
  state = inject(GlobalStateService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  currentView = signal('home');
  sidebarOpen = signal(false);
  searchQuery = '';
  mailCount = signal(0);
  recentMails = signal<any[]>([]);

  navItems: NavItem[] = [
    { id: 'home', icon: 'home', label: '首页', color: '#4285f4' },
    { id: 'inbox', icon: 'inbox', label: '收件箱', color: '#ea4335' },
    { id: 'addresses', icon: 'alternate_email', label: '我的地址', color: '#34a853' },
    { id: 'user', icon: 'person', label: '用户登录', color: '#9c27b0' },
    { id: 'settings', icon: 'settings', label: '设置', color: '#fbbc04' },
  ];

  constructor(private route: ActivatedRoute) {
    effect(() => {
      const jwt = this.state.jwt();
      const address = this.state.settings().address;
      if (jwt && address) {
        const exists = this.state.savedAddresses().some(a => a.address === address);
        if (!exists) {
          this.state.addSavedAddress(address, jwt);
        }
      }
    });
    
    // Check route data for user view
    this.route.data.subscribe(data => {
      if (data['view'] === 'user') {
        this.currentView.set('user');
        this.loadUserSettings();
      }
    });
    
    // Also check query params
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'user') {
        this.currentView.set('user');
        this.loadUserSettings();
      }
    });
  }

  async ngOnInit() {
    await this.loadMails();
  }

  async loadMails() {
    try {
      const res = await this.api.fetch<{ results: any[]; count: number }>('/api/mails?limit=10&offset=0');
      this.mailCount.set(res.count || 0);
      this.recentMails.set(res.results || []);
    } catch (e) {
      // ignore
    }
  }

  selectNav(item: NavItem) {
    this.currentView.set(item.id);
    if (item.id === 'user') {
      this.loadUserSettings();
    }
  }

  async loadUserSettings() {
    await this.api.getUserOpenSettings();
    if (!this.state.userSettings().user_id) {
      await this.api.getUserSettings();
    }
  }

  toggleTheme() { this.state.toggleDark(); }
  goAdmin() { this.router.navigate(['/admin']); }
  goUser() { this.router.navigate(['/user']); }

  getInitial(): string {
    const addr = this.state.settings().address;
    return addr ? addr.charAt(0).toUpperCase() : '?';
  }

  async copyAddress() {
    const address = this.state.settings().address;
    if (address) {
      await navigator.clipboard.writeText(address);
      this.snackbar.success('地址已复制');
    }
  }

  async copyAddr(address: string) {
    await navigator.clipboard.writeText(address);
    this.snackbar.success('地址已复制');
  }

  async switchAddress(address: string) {
    if (this.state.switchToAddress(address)) {
      await this.api.getSettings();
      await this.loadMails();
      this.snackbar.success('已切换到 ' + address);
    }
  }

  deleteAddress(address: string) {
    const isActive = address === this.state.settings().address;
    this.state.removeSavedAddress(address);
    if (isActive) {
      const remaining = this.state.savedAddresses();
      if (remaining.length > 0) {
        this.switchAddress(remaining[0].address);
      }
    }
    this.snackbar.success('地址已删除');
  }

  refresh() {
    this.loadMails();
    this.state.triggerRefresh();
    this.snackbar.success('已刷新');
  }

  searchMails() {
    if (this.searchQuery.trim()) {
      this.state.searchQuery.set(this.searchQuery);
      this.currentView.set('inbox');
    }
  }

  getMailInitial(source: string): string {
    if (!source) return '?';
    const match = source.match(/^([^<]+)/);
    const name = match ? match[1].trim() : source.split('@')[0];
    return name.charAt(0).toUpperCase();
  }

  getMailSender(source: string): string {
    if (!source) return '未知';
    const match = source.match(/^([^<]+)/);
    return match ? match[1].trim() : source.split('@')[0];
  }

  formatTime(date: string): string {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  openMail(mail: any) {
    this.currentView.set('inbox');
    // TODO: open specific mail
  }

  newAddress() {
    const dialogRef = this.dialog.open(NewAddressDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMails();
      }
    });
  }
}

@Component({
  selector: 'app-new-address-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <div class="dialog-container">
      <h2>新建邮箱地址</h2>
      <p class="hint">立即获取一个新的临时邮箱地址</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>邮箱名称（可选）</mat-label>
        <input matInput [(ngModel)]="addressName" placeholder="留空则随机生成">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width" *ngIf="domains.length > 1">
        <mat-label>域名</mat-label>
        <mat-select [(ngModel)]="selectedDomain">
          <mat-option *ngFor="let d of domains" [value]="d">{{ d }}</mat-option>
        </mat-select>
      </mat-form-field>
      <div class="actions">
        <button mat-button mat-dialog-close>取消</button>
        <button mat-flat-button color="primary" (click)="create()" [disabled]="creating()">创建</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container { padding: 24px; }
    h2 { margin: 0 0 8px; font-size: 24px; font-weight: 400; }
    .hint { color: #5f6368; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class NewAddressDialogComponent implements OnInit {
  private api = inject(ApiService);
  private state = inject(GlobalStateService);
  private snackbar = inject(SnackbarService);
  private dialogRef = inject(MatDialogRef<NewAddressDialogComponent>);

  addressName = '';
  domains: string[] = [];
  selectedDomain = '';
  creating = signal(false);

  ngOnInit() {
    this.domains = this.state.openSettings().defaultDomains || ['localhost.test'];
    this.selectedDomain = this.domains[0];
  }

  async create() {
    this.creating.set(true);
    try {
      const res = await this.api.fetch<{ jwt: string }>('/api/new_address', {
        method: 'POST',
        body: { name: this.addressName || undefined, domain: this.selectedDomain },
      });
      if (res.jwt) {
        this.state.setJwt(res.jwt);
        await this.api.getSettings();
        const address = this.state.settings().address;
        if (address) {
          this.state.addSavedAddress(address, res.jwt);
        }
        this.snackbar.success('地址创建成功');
        this.dialogRef.close(true);
      }
    } catch (error: any) {
      this.snackbar.error(error.message || '创建失败');
    } finally {
      this.creating.set(false);
    }
  }
}
