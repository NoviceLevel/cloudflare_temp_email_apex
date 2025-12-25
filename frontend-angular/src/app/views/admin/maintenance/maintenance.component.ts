import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatCheckboxModule,
    MatTabsModule, MatIconModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-content>
          <div class="alert warning mb-3">
            启用定时清理, 需在 worker 配置 [crons] 参数, 请参考文档, 配置为 0 天表示全部清空
          </div>
          
          <div class="actions-row mb-3">
            <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">
              保存
            </button>
          </div>

          <mat-tab-group>
            <mat-tab label="基础清理">
              <div class="tab-content">
                @for (item of cleanupItems; track item.type) {
                  <div class="cleanup-row mb-3">
                    <mat-checkbox [(ngModel)]="cleanupModel[item.enableKey]">自动清理</mat-checkbox>
                    <span class="flex-grow">{{ item.label }}</span>
                    <mat-form-field appearance="outline" class="days-field">
                      <input matInput type="number" [(ngModel)]="cleanupModel[item.daysKey]" placeholder="天数">
                    </mat-form-field>
                    <button mat-stroked-button (click)="cleanup(item.type, cleanupModel[item.daysKey])">
                      <mat-icon>cleaning_services</mat-icon>
                      立即清理
                    </button>
                  </div>
                }
              </div>
            </mat-tab>
            <mat-tab label="自定义 SQL 清理">
              <div class="tab-content">
                <div class="alert info mb-3">
                  添加自定义 DELETE SQL 语句进行定时清理。每条记录仅允许单条 DELETE 语句。
                </div>
                
                @for (item of cleanupModel.customSqlCleanupList; track item.id; let i = $index) {
                  <mat-card class="mb-3">
                    <mat-card-content>
                      <div class="row mb-2">
                        <mat-checkbox [(ngModel)]="item.enabled">自动清理</mat-checkbox>
                        <mat-form-field appearance="outline" class="name-field">
                          <mat-label>名称</mat-label>
                          <input matInput [(ngModel)]="item.name" placeholder="例如: 清理旧日志">
                        </mat-form-field>
                        <button mat-button color="warn" (click)="removeCustomSql(i)">
                          <mat-icon>delete</mat-icon>
                          删除
                        </button>
                      </div>
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>SQL 语句 (仅限 DELETE)</mat-label>
                        <textarea matInput [(ngModel)]="item.sql" rows="2"></textarea>
                      </mat-form-field>
                    </mat-card-content>
                  </mat-card>
                }
                
                <button mat-stroked-button (click)="addCustomSql()">
                  <mat-icon>add</mat-icon>
                  添加自定义 SQL
                </button>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 800px; width: 100%; }
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .alert { padding: 12px 16px; border-radius: 4px; }
    .alert.warning { background-color: #fff3e0; color: #e65100; }
    .alert.info { background-color: #e3f2fd; color: #1976d2; }
    .actions-row { display: flex; justify-content: flex-end; }
    .cleanup-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .flex-grow { flex: 1; min-width: 200px; }
    .days-field { width: 100px; }
    .name-field { width: 200px; }
    .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tab-content { padding: 16px 0; }
  `]
})
export class MaintenanceComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  cleanupItems = [
    { label: '清理 n 天前的收件箱', enableKey: 'enableMailsAutoCleanup', daysKey: 'cleanMailsDays', type: 'mails' },
    { label: '清理 n 天前的无收件人邮件', enableKey: 'enableUnknowMailsAutoCleanup', daysKey: 'cleanUnknowMailsDays', type: 'mails_unknow' },
    { label: '清理 n 天前的发件箱', enableKey: 'enableSendBoxAutoCleanup', daysKey: 'cleanSendBoxDays', type: 'sendbox' },
    { label: '清理 n 天前创建的地址', enableKey: 'enableAddressAutoCleanup', daysKey: 'cleanAddressDays', type: 'addressCreated' },
    { label: '清理 n 天前的未活跃地址', enableKey: 'enableInactiveAddressAutoCleanup', daysKey: 'cleanInactiveAddressDays', type: 'inactiveAddress' },
    { label: '清理 n 天前的未绑定用户地址', enableKey: 'enableUnboundAddressAutoCleanup', daysKey: 'cleanUnboundAddressDays', type: 'unboundAddress' },
    { label: '清理 n 天前空邮件的邮箱地址', enableKey: 'enableEmptyAddressAutoCleanup', daysKey: 'cleanEmptyAddressDays', type: 'emptyAddress' }
  ];

  cleanupModel: any = {
    enableMailsAutoCleanup: false, cleanMailsDays: 30,
    enableUnknowMailsAutoCleanup: false, cleanUnknowMailsDays: 30,
    enableSendBoxAutoCleanup: false, cleanSendBoxDays: 30,
    enableAddressAutoCleanup: false, cleanAddressDays: 30,
    enableInactiveAddressAutoCleanup: false, cleanInactiveAddressDays: 30,
    enableUnboundAddressAutoCleanup: false, cleanUnboundAddressDays: 30,
    enableEmptyAddressAutoCleanup: false, cleanEmptyAddressDays: 30,
    customSqlCleanupList: []
  };

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/auto_cleanup');
      if (res) Object.assign(this.cleanupModel, res);
      if (!this.cleanupModel.customSqlCleanupList) this.cleanupModel.customSqlCleanupList = [];
    } catch (error: any) {
      this.snackbar.error(error.message || '获取设置失败');
    }
  }

  async cleanup(cleanType: string, cleanDays: number) {
    try {
      await this.api.fetch('/admin/cleanup', {
        method: 'POST',
        body: { cleanType, cleanDays }
      });
      this.snackbar.success('清理成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '清理失败');
    }
  }

  addCustomSql() {
    this.cleanupModel.customSqlCleanupList.push({
      id: Date.now().toString(),
      name: '',
      sql: '',
      enabled: false
    });
  }

  removeCustomSql(index: number) {
    this.cleanupModel.customSqlCleanupList.splice(index, 1);
  }

  async save() {
    try {
      await this.api.fetch('/admin/auto_cleanup', {
        method: 'POST',
        body: this.cleanupModel
      });
      this.snackbar.success('保存成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '保存失败');
    }
  }
}
