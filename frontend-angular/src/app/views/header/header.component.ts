import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GlobalStateService } from '../../services/global-state.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSidenavModule,
    MatListModule,
    TranslateModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <img src="/logo.png" alt="Logo" width="32" height="32" class="logo" (click)="logoClick()">
      <span class="title">{{ state.openSettings().title || '临时邮箱' }}</span>
      
      <span class="spacer"></span>

      <!-- Desktop Menu -->
      <ng-container *ngIf="!isMobile()">
        <button mat-button (click)="goHome()">
          <mat-icon>home</mat-icon>
          主页
        </button>
        <button mat-button (click)="goUser()">
          <mat-icon>person</mat-icon>
          用户
        </button>
        @if (state.showAdminPage()) {
          <button mat-button (click)="goAdmin()">
            <mat-icon>admin_panel_settings</mat-icon>
            Admin
          </button>
        }
        <button mat-button (click)="toggleTheme()">
          <mat-icon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          {{ isDark() ? '亮色' : '暗色' }}
        </button>
        <button mat-button (click)="toggleLang()">
          <mat-icon>translate</mat-icon>
          {{ currentLang() === 'zh' ? 'English' : '中文' }}
        </button>
        @if (state.openSettings().showGithub) {
          <a mat-button href="https://github.com/dreamhunter2333/cloudflare_temp_email" target="_blank">
            <mat-icon>code</mat-icon>
            Github
          </a>
        }
      </ng-container>

      <!-- Mobile Menu Button -->
      @if (isMobile()) {
        <button mat-icon-button (click)="showMobileMenu.set(!showMobileMenu())">
          <mat-icon>menu</mat-icon>
        </button>
      }
    </mat-toolbar>

    <!-- Mobile Menu -->
    @if (isMobile() && showMobileMenu()) {
      <div class="mobile-menu">
        <mat-nav-list>
          <mat-list-item (click)="goHome()">
            <mat-icon matListItemIcon>home</mat-icon>
            <span matListItemTitle>主页</span>
          </mat-list-item>
          <mat-list-item (click)="goUser()">
            <mat-icon matListItemIcon>person</mat-icon>
            <span matListItemTitle>用户</span>
          </mat-list-item>
          @if (state.showAdminPage()) {
            <mat-list-item (click)="goAdmin()">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Admin</span>
            </mat-list-item>
          }
          <mat-list-item (click)="toggleTheme()">
            <mat-icon matListItemIcon>{{ isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            <span matListItemTitle>{{ isDark() ? '亮色' : '暗色' }}</span>
          </mat-list-item>
          <mat-list-item (click)="toggleLang()">
            <mat-icon matListItemIcon>translate</mat-icon>
            <span matListItemTitle>{{ currentLang() === 'zh' ? 'English' : '中文' }}</span>
          </mat-list-item>
        </mat-nav-list>
      </div>
    }
  `,
  styles: [`
    .logo {
      cursor: pointer;
      margin-right: 8px;
    }
    .title {
      font-size: 18px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .mobile-menu {
      position: absolute;
      top: 64px;
      left: 0;
      right: 0;
      background: var(--mat-sys-surface);
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class HeaderComponent implements OnInit {
  state = inject(GlobalStateService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  showMobileMenu = signal(false);
  currentLang = signal('zh');
  logoClickCount = 0;

  // 使用 GlobalStateService 的 isDark
  isDark = () => this.state.isDark();

  isMobile(): boolean {
    return window.innerWidth < 768;
  }

  async ngOnInit() {
    // 检查是否需要显示认证对话框
    if (this.state.showAuth()) {
      this.openAuthDialog();
    }
  }

  openAuthDialog() {
    const dialogRef = this.dialog.open(AuthDialogComponent, {
      width: '400px',
      disableClose: true
    });
    dialogRef.afterClosed().subscribe(password => {
      if (password) {
        this.state.setAuth(password);
        location.reload();
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
    this.showMobileMenu.set(false);
  }

  goUser() {
    this.router.navigate(['/user']);
    this.showMobileMenu.set(false);
  }

  goAdmin() {
    this.router.navigate(['/admin']);
    this.showMobileMenu.set(false);
  }

  toggleTheme() {
    this.state.toggleDark();
    document.body.classList.toggle('dark-theme', this.state.isDark());
    this.showMobileMenu.set(false);
  }

  toggleLang() {
    const newLang = this.currentLang() === 'zh' ? 'en' : 'zh';
    this.currentLang.set(newLang);
    this.translate.use(newLang);
    this.showMobileMenu.set(false);
  }

  logoClick() {
    this.logoClickCount++;
    if (this.logoClickCount >= 5) {
      this.logoClickCount = 0;
      this.router.navigate(['/admin']);
    } else {
      this.snackbar.info(`再点击 ${5 - this.logoClickCount} 次进入管理页面`);
    }
  }
}

// Auth Dialog Component
@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>访问密码</h2>
    <mat-dialog-content>
      <p>请输入站点访问密码</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>密码</mat-label>
        <input matInput type="password" [(ngModel)]="password" (keyup.enter)="submit()">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="submit()">确定</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class AuthDialogComponent {
  private dialogRef = inject(MatDialogRef<AuthDialogComponent>);
  password = '';

  submit() {
    this.dialogRef.close(this.password);
  }
}
