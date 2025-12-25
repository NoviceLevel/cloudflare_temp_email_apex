import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-database-manager',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-content>
          @if (dbVersionData().need_initialization) {
            <div class="alert warning mb-3">
              需要初始化数据库，请初始化数据库
              <button mat-stroked-button color="primary" class="mt-2 full-width"
                      (click)="initialization()" [disabled]="state.loading()">
                初始化数据库
              </button>
            </div>
          }

          @if (dbVersionData().need_migration) {
            <div class="alert warning mb-3">
              需要迁移数据库，请迁移数据库
              <button mat-stroked-button color="primary" class="mt-2 full-width"
                      (click)="migration()" [disabled]="state.loading()">
                升级数据库 Schema
              </button>
            </div>
          }

          <div class="alert info">
            当前数据库版本: {{ dbVersionData().current_db_version || 'unknown' }},
            需要的数据库版本: {{ dbVersionData().code_db_version }}
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 800px; width: 100%; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
    .mt-2 { margin-top: 8px; }
    .alert { padding: 12px 16px; border-radius: 4px; }
    .alert.warning { background-color: #fff3e0; color: #e65100; }
    .alert.info { background-color: #e3f2fd; color: #1976d2; }
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

  async ngOnInit() {
    await this.fetchData();
  }

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
