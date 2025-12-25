import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-admin-telegram',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatCheckboxModule,
    MatChipsModule, MatIconModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-actions align="end">
          <button mat-stroked-button (click)="fetchStatus()">查看状态</button>
          <button mat-stroked-button color="primary" (click)="init()">初始化</button>
          <button mat-raised-button color="primary" (click)="saveSettings()">保存</button>
        </mat-card-actions>
        <mat-card-content>
          <div class="setting-row mb-3">
            <p class="label">启用 Telegram 白名单(手动输入 Chat ID, 回车增加)</p>
            <div class="row">
              <mat-checkbox [(ngModel)]="settings.enableAllowList">启用</mat-checkbox>
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>Telegram 白名单</mat-label>
                <mat-chip-grid #chipGrid1>
                  @for (item of settings.allowList; track item) {
                    <mat-chip-row (removed)="removeItem(settings.allowList, item)">
                      {{item}}
                      <button matChipRemove><mat-icon>cancel</mat-icon></button>
                    </mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid1" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                       (matChipInputTokenEnd)="addItem(settings.allowList, $event)">
              </mat-form-field>
            </div>
          </div>

          <div class="setting-row mb-3">
            <p class="label">启用全局邮件推送(手动输入邮箱管理员的 telegram Chat ID, 回车增加)</p>
            <div class="row">
              <mat-checkbox [(ngModel)]="settings.enableGlobalMailPush">启用</mat-checkbox>
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>全局邮件推送 Chat ID 列表</mat-label>
                <mat-chip-grid #chipGrid2>
                  @for (item of settings.globalMailPushList; track item) {
                    <mat-chip-row (removed)="removeItem(settings.globalMailPushList, item)">
                      {{item}}
                      <button matChipRemove><mat-icon>cancel</mat-icon></button>
                    </mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid2" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                       (matChipInputTokenEnd)="addItem(settings.globalMailPushList, $event)">
              </mat-form-field>
            </div>
            <p class="hint">支持对话/群组/频道的 Chat ID</p>
          </div>

          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>电报小程序 URL</mat-label>
            <input matInput [(ngModel)]="settings.miniAppUrl">
          </mat-form-field>

          @if (status().fetched) {
            <pre class="status-box">{{ status() | json }}</pre>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 800px; width: 100%; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
    .row { display: flex; align-items: center; gap: 8px; }
    .flex-grow { flex: 1; }
    .label { font-size: 14px; color: #666; margin-bottom: 8px; }
    .hint { font-size: 12px; color: #999; margin-top: 4px; }
    .setting-row { margin-bottom: 16px; }
    .status-box { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow: auto; }
  `]
})
export class AdminTelegramComponent implements OnInit {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  separatorKeyCodes = [ENTER, COMMA];
  settings = {
    enableAllowList: false,
    allowList: [] as string[],
    miniAppUrl: '',
    enableGlobalMailPush: false,
    globalMailPushList: [] as string[]
  };
  status = signal<any>({ fetched: false });

  async ngOnInit() {
    await this.getSettings();
  }

  async getSettings() {
    try {
      const res = await this.api.fetch<any>('/admin/telegram/settings');
      Object.assign(this.settings, res);
    } catch (error: any) {
      this.snackbar.error(error.message || '获取设置失败');
    }
  }

  async fetchStatus() {
    try {
      const res = await this.api.fetch<any>('/admin/telegram/status');
      this.status.set({ ...res, fetched: true });
    } catch (error: any) {
      this.snackbar.error(error.message || '获取状态失败');
    }
  }

  async init() {
    try {
      await this.api.fetch('/admin/telegram/init', { method: 'POST' });
      this.snackbar.success('初始化成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '初始化失败');
    }
  }

  async saveSettings() {
    try {
      await this.api.fetch('/admin/telegram/settings', {
        method: 'POST',
        body: this.settings
      });
      this.snackbar.success('保存成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '保存失败');
    }
  }

  addItem(list: string[], event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) list.push(value);
    event.chipInput!.clear();
  }

  removeItem(list: string[], item: string) {
    const index = list.indexOf(item);
    if (index >= 0) list.splice(index, 1);
  }
}
