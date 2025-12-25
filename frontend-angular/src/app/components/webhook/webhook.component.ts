import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '../../services/snackbar.service';

interface WebhookSettings {
  enabled: boolean;
  url: string;
  method: string;
  headers: string;
  body: string;
}

@Component({
  selector: 'app-webhook',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  template: `
    <div class="webhook-container">
      @if (enableWebhook) {
        <mat-card appearance="outlined">
          <mat-card-actions align="end">
            <a mat-button [href]="messagePusherDocLink" target="_blank">
              MessagePusher文档
            </a>
            <button mat-button (click)="fillMessagePusherDemo()">
              填入MessagePusher示例
            </button>
            @if (webhookSettings.enabled) {
              <button mat-button (click)="testSettings()">测试</button>
            }
            <button mat-raised-button color="primary" (click)="saveSettings()">
              保存
            </button>
          </mat-card-actions>
          <mat-card-content>
            <mat-slide-toggle [(ngModel)]="webhookSettings.enabled" color="primary">
              启用
            </mat-slide-toggle>

            @if (webhookSettings.enabled) {
              <div class="form-fields">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>URL</mat-label>
                  <input matInput [(ngModel)]="webhookSettings.url">
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>METHOD</mat-label>
                  <mat-select [(ngModel)]="webhookSettings.method">
                    <mat-option value="POST">POST</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>HEADERS</mat-label>
                  <textarea matInput [(ngModel)]="webhookSettings.headers" rows="3"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>BODY</mat-label>
                  <textarea matInput [(ngModel)]="webhookSettings.body" rows="5"></textarea>
                </mat-form-field>
              </div>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="empty-state">
          <mat-icon>warning</mat-icon>
          <p>Webhook 未开启，请联系管理员开启</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .webhook-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    mat-card {
      max-width: 800px;
      width: 100%;
    }
    .form-fields {
      margin-top: 16px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class WebhookComponent implements OnInit {
  @Input() fetchData!: () => Promise<WebhookSettings>;
  @Input() saveSettingsFn!: (settings: WebhookSettings) => Promise<void>;
  @Input() testSettingsFn!: (settings: WebhookSettings) => Promise<void>;

  private snackbar = inject(SnackbarService);

  messagePusherDocLink = 'https://github.com/songquanpeng/message-pusher';
  enableWebhook = false;

  webhookSettings: WebhookSettings = {
    enabled: false,
    url: '',
    method: 'POST',
    headers: JSON.stringify({}, null, 2),
    body: JSON.stringify({}, null, 2),
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const res = await this.fetchData();
      this.webhookSettings = { ...this.webhookSettings, ...res };
      this.enableWebhook = true;
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  fillMessagePusherDemo() {
    this.webhookSettings = {
      enabled: true,
      url: 'https://msgpusher.com/push/username',
      method: 'POST',
      headers: JSON.stringify({ 'Content-Type': 'application/json' }, null, 2),
      body: JSON.stringify({
        token: 'token',
        title: '${subject}',
        description: '${subject}',
        content: '*${subject}*\n\nFrom: ${from}\nTo: ${to}\n\n${parsedText}\n',
      }, null, 2),
    };
    this.snackbar.info('请修改URL和其他设置为您自己的配置');
  }

  async saveSettings() {
    if (!this.webhookSettings.url) {
      this.snackbar.error('URL 不能为空');
      return;
    }
    try {
      await this.saveSettingsFn(this.webhookSettings);
      this.snackbar.success('成功');
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async testSettings() {
    if (!this.webhookSettings.url) {
      this.snackbar.error('URL 不能为空');
      return;
    }
    try {
      await this.testSettingsFn(this.webhookSettings);
      this.snackbar.success('成功');
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}
