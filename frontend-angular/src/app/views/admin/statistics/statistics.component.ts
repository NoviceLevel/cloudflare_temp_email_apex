import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="statistics-container">
      <mat-card appearance="outlined" class="mb-4">
        <mat-card-content>
          <div class="stats-row">
            <div class="stat-item">
              <mat-icon color="primary">account_circle</mat-icon>
              <div class="stat-value">{{ statistics().addressCount }}</div>
              <div class="stat-label">邮箱地址总数</div>
            </div>
            <div class="stat-item">
              <mat-icon color="accent">verified_user</mat-icon>
              <div class="stat-value">{{ statistics().activeAddressCount7days }}</div>
              <div class="stat-label">7天活跃邮箱地址总数</div>
            </div>
            <div class="stat-item">
              <mat-icon color="accent">verified_user</mat-icon>
              <div class="stat-value">{{ statistics().activeAddressCount30days }}</div>
              <div class="stat-label">30天活跃邮箱地址总数</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="stats-row">
            <div class="stat-item">
              <mat-icon color="primary">group</mat-icon>
              <div class="stat-value">{{ statistics().userCount }}</div>
              <div class="stat-label">用户总数</div>
            </div>
            <div class="stat-item">
              <mat-icon color="primary">email</mat-icon>
              <div class="stat-value">{{ statistics().mailCount }}</div>
              <div class="stat-label">邮件总数</div>
            </div>
            <div class="stat-item">
              <mat-icon color="warn">send</mat-icon>
              <div class="stat-value">{{ statistics().sendMailCount }}</div>
              <div class="stat-label">发送邮件总数</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .statistics-container {
      padding: 16px 0;
    }
    .mb-4 {
      margin-bottom: 16px;
    }
    .stats-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      gap: 24px;
    }
    .stat-item {
      text-align: center;
      padding: 16px;
      min-width: 150px;
    }
    .stat-item mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    :host-context(.dark-theme) .stat-label {
      color: #aaa;
    }
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

  async ngOnInit() {
    await this.fetchStatistics();
  }

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
      this.snackbar.error(error.message || 'error');
    }
  }
}
