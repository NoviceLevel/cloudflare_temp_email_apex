import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSlideToggleModule, MatIconModule, MatExpansionModule
  ],
  template: `
    <div class="maintenance-page">
      <!-- 提示信息 -->
      <div class="admin-alert warning mb-4">
        <mat-icon>info</mat-icon>
        <span>启用定时清理需在 worker 配置 [crons] 参数，请参考文档。配置为 0 天表示全部清空。</span>
      </div>

      <!-- 基础清理 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>cleaning_services</mat-icon>
          自动清理设置
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            @for (item of cleanupItems; track item.type) {
              <div class="cleanup-item">
                <div class="cleanup-info">
                  <mat-slide-toggle [(ngModel)]="cleanupModel[item.enableKey]"></mat-slide-toggle>
                  <span class="cleanup-label">{{ item.label }}</span>
                </div>
                <div class="cleanup-actions">
                  <mat-form-field appearance="outline" class="days-input">
                    <input matInput type="number" [(ngModel)]="cleanupModel[item.daysKey]" min="0">
                    <span matSuffix>天</span>
                  </mat-form-field>
                  <button mat-stroked-button (click)="cleanup(item.type, cleanupModel[item.daysKey])">
                    立即清理
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- 自定义 SQL 清理 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>code</mat-icon>
          自定义 SQL 清理
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="admin-alert info mb-3">
              <mat-icon>info</mat-icon>
              <span>添加自定义 DELETE SQL 语句进行定时清理。每条记录仅允许单条 DELETE 语句。</span>
            </div>

            @for (item of cleanupModel.customSqlCleanupList; track item.id; let i = $index) {
              <div class="sql-card">
                <div class="sql-header">
                  <mat-slide-toggle [(ngModel)]="item.enabled"></mat-slide-toggle>
                  <mat-form-field appearance="outline" class="name-input">
                    <input matInput [(ngModel)]="item.name" placeholder="规则名称">
                  </mat-form-field>
                  <button mat-icon-button color="warn" (click)="removeCustomSql(i)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
                <mat-form-field appearance="outline" class="full-width">
                  <textarea matInput [(ngModel)]="item.sql" rows="2" placeholder="DELETE FROM table WHERE ..."></textarea>
                </mat-form-field>
              </div>
            }

            <button mat-stroked-button (click)="addCustomSql()" class="add-btn">
              <mat-icon>add</mat-icon>
              添加自定义 SQL
            </button>
          </div>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="form-actions">
        <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">
          <mat-icon>save</mat-icon>
          保存设置
        </button>
      </div>
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .maintenance-page { max-width: 900px; }
    .cleanup-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; gap: 16px; flex-wrap: wrap; }
    .cleanup-item:last-child { border-bottom: none; }
    :host-context(.dark) .cleanup-item { border-color: #3c4043; }
    .cleanup-info { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 250px; }
    .cleanup-label { font-size: 14px; color: #202124; }
    :host-context(.dark) .cleanup-label { color: #e8eaed; }
    .cleanup-actions { display: flex; align-items: center; gap: 8px; }
    .days-input { width: 100px; }
    .days-input ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .sql-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    :host-context(.dark) .sql-card { background: #3c4043; }
    .sql-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .name-input { flex: 1; }
    .name-input ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .add-btn { width: 100%; }
  `]
})
export class MaintenanceComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  cleanupItems = [
    { label: '清理收件箱', enableKey: 'enableMailsAutoCleanup', daysKey: 'cleanMailsDays', type: 'mails' },
    { label: '清理无收件人邮件', enableKey: 'enableUnknowMailsAutoCleanup', daysKey: 'cleanUnknowMailsDays', type: 'mails_unknow' },
    { label: '清理发件箱', enableKey: 'enableSendBoxAutoCleanup', daysKey: 'cleanSendBoxDays', type: 'sendbox' },
    { label: '清理创建的地址', enableKey: 'enableAddressAutoCleanup', daysKey: 'cleanAddressDays', type: 'addressCreated' },
    { label: '清理未活跃地址', enableKey: 'enableInactiveAddressAutoCleanup', daysKey: 'cleanInactiveAddressDays', type: 'inactiveAddress' },
    { label: '清理未绑定用户地址', enableKey: 'enableUnboundAddressAutoCleanup', daysKey: 'cleanUnboundAddressDays', type: 'unboundAddress' },
    { label: '清理空邮件邮箱地址', enableKey: 'enableEmptyAddressAutoCleanup', daysKey: 'cleanEmptyAddressDays', type: 'emptyAddress' }
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

  async ngOnInit() { await this.fetchData(); }

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
      await this.api.fetch('/admin/cleanup', { method: 'POST', body: { cleanType, cleanDays } });
      this.snackbar.success('清理成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '清理失败');
    }
  }

  addCustomSql() {
    this.cleanupModel.customSqlCleanupList.push({ id: Date.now().toString(), name: '', sql: '', enabled: false });
  }

  removeCustomSql(index: number) {
    this.cleanupModel.customSqlCleanupList.splice(index, 1);
  }

  async save() {
    try {
      await this.api.fetch('/admin/auto_cleanup', { method: 'POST', body: this.cleanupModel });
      this.snackbar.success('保存成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '保存失败');
    }
  }
}
