import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="statistics-page">
      <!-- 概览卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><mat-icon>email</mat-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics().mailCount | number }}</div>
            <div class="stat-label">邮件总数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green"><mat-icon>send</mat-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics().sendMailCount | number }}</div>
            <div class="stat-label">发送邮件总数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple"><mat-icon>alternate_email</mat-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics().addressCount | number }}</div>
            <div class="stat-label">邮箱地址总数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orange"><mat-icon>people</mat-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ statistics().userCount | number }}</div>
            <div class="stat-label">用户总数</div>
          </div>
        </div>
      </div>

      <!-- 活跃度统计 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>trending_up</mat-icon>
          活跃度统计
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="activity-grid">
              <div class="activity-item">
                <div class="activity-period">7 天</div>
                <div class="activity-value">{{ statistics().activeAddressCount7days | number }}</div>
                <div class="activity-label">活跃邮箱地址</div>
              </div>
              <div class="activity-item">
                <div class="activity-period">30 天</div>
                <div class="activity-value">{{ statistics().activeAddressCount30days | number }}</div>
                <div class="activity-label">活跃邮箱地址</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 刷新按钮 -->
      <div class="refresh-row">
        <button mat-stroked-button (click)="fetchStatistics()">
          <mat-icon>refresh</mat-icon>
          刷新数据
        </button>
      </div>
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .statistics-page { }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #fff; border: 1px solid #dadce0; border-radius: 8px; padding: 20px; display: flex; align-items: center; gap: 16px; }
    :host-context(.dark) .stat-card { background: #292a2d; border-color: #3c4043; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .stat-icon mat-icon { font-size: 24px; width: 24px; height: 24px; color: white; }
    .stat-icon.blue { background: linear-gradient(135deg, #4285f4, #1a73e8); }
    .stat-icon.green { background: linear-gradient(135deg, #34a853, #137333); }
    .stat-icon.purple { background: linear-gradient(135deg, #a142f4, #7b1fa2); }
    .stat-icon.orange { background: linear-gradient(135deg, #fbbc04, #ea8600); }
    .stat-content { flex: 1; }
    .stat-value { font-size: 28px; font-weight: 500; color: #202124; line-height: 1.2; }
    :host-context(.dark) .stat-value { color: #e8eaed; }
    .stat-label { font-size: 13px; color: #5f6368; margin-top: 4px; }
    :host-context(.dark) .stat-label { color: #9aa0a6; }

    .activity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 24px; }
    .activity-item { text-align: center; padding: 16px; }
    .activity-period { font-size: 12px; font-weight: 500; color: #1a73e8; background: #e8f0fe; padding: 4px 12px; border-radius: 12px; display: inline-block; margin-bottom: 12px; }
    :host-context(.dark) .activity-period { background: #174ea6; color: #8ab4f8; }
    .activity-value { font-size: 36px; font-weight: 500; color: #202124; }
    :host-context(.dark) .activity-value { color: #e8eaed; }
    .activity-label { font-size: 13px; color: #5f6368; margin-top: 4px; }
    :host-context(.dark) .activity-label { color: #9aa0a6; }

    .refresh-row { display: flex; justify-content: center; margin-top: 24px; }
  `]
})
export class AdminStatisticsComponent implements OnInit {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  statistics = signal({
    addressCount: 0,
    userCount: 0,
    mailCount: 0,
    activeAddressCount7days: 0,
    activeAddressCount30days: 0,
    sendMailCount: 0,
  });

  async ngOnInit() { await this.fetchStatistics(); }

  async fetchStatistics() {
    try {
      const res = await this.api.adminGetStatistics();
      this.statistics.set({
        mailCount: res.mailCount || 0,
        sendMailCount: res.sendMailCount || 0,
        userCount: res.userCount || 0,
        addressCount: res.addressCount || 0,
        activeAddressCount7days: res.activeAddressCount7days || 0,
        activeAddressCount30days: res.activeAddressCount30days || 0,
      });
    } catch (error: any) {
      this.snackbar.error(error.message || '获取统计数据失败');
    }
  }
}
