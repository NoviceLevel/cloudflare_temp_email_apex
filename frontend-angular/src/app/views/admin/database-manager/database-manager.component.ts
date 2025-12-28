import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

@Component({
  selector: 'app-database-manager',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="database-page">
      <!-- 状态卡片 -->
      <div class="status-card" [class.warning]="dbVersionData().need_initialization || dbVersionData().need_migration">
        <div class="status-icon">
          <mat-icon>{{ (dbVersionData().need_initialization || dbVersionData().need_migration) ? 'warning' : 'check_circle' }}</mat-icon>
        </div>
        <div class="status-content">
          <div class="status-title">
            {{ (dbVersionData().need_initialization || dbVersionData().need_migration) ? '需要操作' : '数据库正常' }}
          </div>
          <div class="status-desc">
            当前版本: {{ dbVersionData().current_db_version || '未初始化' }} | 
            需要版本: {{ dbVersionData().code_db_version }}
          </div>
        </div>
      </div>

      @if (dbVersionData().need_initialization) {
        <div class="admin-section">
          <div class="admin-card">
            <div class="admin-card-body">
              <div class="admin-alert warning mb-3">
                <mat-icon>warning</mat-icon>
                <div>
                  <strong>需要初始化数据库</strong>
                  <p>数据库尚未初始化，请点击下方按钮进行初始化操作</p>
                </div>
              </div>
              <button mat-raised-button color="primary" (click)="initialization()" [disabled]="state.loading()">
                <mat-icon>play_arrow</mat-icon>
                初始化数据库
              </button>
            </div>
          </div>
        </div>
      }

      @if (dbVersionData().need_migration) {
        <div class="admin-section">
          <div class="admin-card">
            <div class="admin-card-body">
              <div class="admin-alert warning mb-3">
                <mat-icon>warning</mat-icon>
                <div>
                  <strong>需要升级数据库</strong>
                  <p>数据库版本过旧，请点击下方按钮进行升级操作</p>
                </div>
              </div>
              <button mat-raised-button color="primary" (click)="migration()" [disabled]="state.loading()">
                <mat-icon>upgrade</mat-icon>
                升级数据库 Schema
              </button>
            </div>
          </div>
        </div>
      }

      @if (!dbVersionData().need_initialization && !dbVersionData().need_migration) {
        <div class="admin-section">
          <div class="admin-card">
            <div class="admin-card-body">
              <div class="admin-alert success">
                <mat-icon>check_circle</mat-icon>
                <span>数据库版本正常，无需操作</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .database-page { max-width: 600px; }
    .status-card { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: #e6f4ea; border-radius: 8px; margin-bottom: 24px; }
    .status-card.warning { background: #fef7e0; }
    .status-icon { width: 48px; height: 48px; border-radius: 50%; background: #137333; color: white; display: flex; align-items: center; justify-content: center; }
    .status-card.warning .status-icon { background: #ea8600; }
    .status-icon mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .status-content { flex: 1; }
    .status-title { font-size: 18px; font-weight: 500; color: #137333; }
    .status-card.warning .status-title { color: #ea8600; }
    .status-desc { font-size: 14px; color: #5f6368; margin-top: 4px; }
  `]
})
export class DatabaseManagerComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  dbVersionData = signal<any>({
    need_initialization: false,
    need_migration: false,
    current_db_version: '',
    code_db_version: ''
  });

  async ngOnInit() { await this.fetchData(); }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/db_version');
      if (res) this.dbVersionData.set(res);
    } catch (error: any) {
      this.snackbar.error(error.message || '获取数据库版本失败');
    }
  }

  async initialization() {
    try {
      await this.api.fetch('/admin/db_initialize', { method: 'POST' });
      await this.fetchData();
      this.snackbar.success('数据库初始化成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '初始化失败');
    }
  }

  async migration() {
    try {
      await this.api.fetch('/admin/db_migration', { method: 'POST' });
      await this.fetchData();
      this.snackbar.success('数据库升级成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '升级失败');
    }
  }
}
