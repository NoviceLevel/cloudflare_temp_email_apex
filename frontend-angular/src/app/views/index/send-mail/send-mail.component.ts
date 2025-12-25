import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { AdminContactComponent } from '../../common/admin-contact/admin-contact.component';

@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonToggleModule,
    MatIconModule,
    AdminContactComponent,
  ],
  template: `
    @if (state.settings().address) {
      <div class="send-mail-container">
        <mat-card appearance="outlined">
          <mat-card-content>
            @if (!state.settings().send_balance || state.settings().send_balance <= 0) {
              <!-- 无发送额度 -->
              <div class="warning-alert">
                <mat-icon>warning</mat-icon>
                <span>您需要申请权限才能发送邮件, 如果已经申请过, 请联系管理员提升额度。</span>
                <button mat-stroked-button color="primary" (click)="requestAccess()">
                  申请权限
                </button>
              </div>
              <app-admin-contact></app-admin-contact>
            } @else {
              <!-- 有发送额度 -->
              <div class="info-alert">
                <mat-icon>info</mat-icon>
                <span>剩余发送邮件额度: {{ state.settings().send_balance }}</span>
              </div>

              <div class="actions-row">
                <button mat-raised-button color="primary" (click)="send()">发送</button>
              </div>

              <!-- 发件人 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>你的名称和地址，名称不填写则使用邮箱地址</mat-label>
                <input matInput [(ngModel)]="sendMailModel.fromName" placeholder="名称">
                <span matSuffix class="address-suffix">{{ state.settings().address }}</span>
              </mat-form-field>

              <!-- 收件人 -->
              <div class="row-fields">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>收件人名称</mat-label>
                  <input matInput [(ngModel)]="sendMailModel.toName">
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>Email</mat-label>
                  <input matInput [(ngModel)]="sendMailModel.toMail" type="email">
                </mat-form-field>
              </div>

              <!-- 主题 -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>主题</mat-label>
                <input matInput [(ngModel)]="sendMailModel.subject">
              </mat-form-field>

              <!-- 选项 -->
              <div class="options-row">
                <span class="options-label">选项:</span>
                <mat-button-toggle-group [(ngModel)]="sendMailModel.contentType">
                  <mat-button-toggle value="text">文本</mat-button-toggle>
                  <mat-button-toggle value="html">HTML</mat-button-toggle>
                </mat-button-toggle-group>
                @if (sendMailModel.contentType !== 'text') {
                  <button mat-stroked-button (click)="isPreview.set(!isPreview())">
                    {{ isPreview() ? '编辑' : '预览' }}
                  </button>
                }
              </div>

              <!-- 内容 -->
              <div class="content-section">
                <label class="content-label">内容</label>
                @if (isPreview()) {
                  <mat-card appearance="outlined" class="preview-card">
                    <mat-card-content [innerHTML]="sendMailModel.content"></mat-card-content>
                  </mat-card>
                } @else {
                  <mat-form-field appearance="outline" class="full-width">
                    <textarea matInput [(ngModel)]="sendMailModel.content" rows="10"></textarea>
                  </mat-form-field>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .send-mail-container {
      display: flex;
      justify-content: center;
      padding: 16px;
    }
    mat-card {
      max-width: 800px;
      width: 100%;
    }
    .warning-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #fff3e0;
      border-radius: 4px;
      color: #e65100;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .info-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
      margin-bottom: 16px;
    }
    .actions-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 8px;
    }
    .row-fields {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;
    }
    .flex-1 {
      flex: 1;
    }
    .options-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .options-label {
      font-weight: 500;
    }
    .content-section {
      margin-top: 8px;
    }
    .content-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .preview-card {
      min-height: 200px;
    }
    .address-suffix {
      color: #666;
      font-size: 14px;
    }
    :host-context(.dark-theme) .warning-alert {
      background-color: #4a3000;
      color: #ffb74d;
    }
    :host-context(.dark-theme) .info-alert {
      background-color: #1e3a5f;
      color: #90caf9;
    }
  `]
})
export class SendMailComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  isPreview = signal(false);

  sendMailModel = {
    fromName: '',
    toName: '',
    toMail: '',
    subject: '',
    contentType: 'text',
    content: '',
  };

  async ngOnInit() {
    await this.api.getSettings();
  }

  async send() {
    try {
      await this.api.fetch('/api/send_mail', {
        method: 'POST',
        body: {
          from_name: this.sendMailModel.fromName,
          to_name: this.sendMailModel.toName,
          to_mail: this.sendMailModel.toMail,
          subject: this.sendMailModel.subject,
          is_html: this.sendMailModel.contentType !== 'text',
          content: this.sendMailModel.content,
        },
      });
      // 重置表单
      this.sendMailModel = {
        fromName: '',
        toName: '',
        toMail: '',
        subject: '',
        contentType: 'text',
        content: '',
      };
      this.snackbar.success('请查看您的发件箱, 如果失败, 请检查您的余额或稍后重试。');
      // 切换到发件箱 tab
      this.state.indexTab.set('sendbox');
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async requestAccess() {
    try {
      await this.api.fetch('/api/requset_send_mail_access', {
        method: 'POST',
        body: {},
      });
      this.snackbar.success('成功');
      await this.api.getSettings();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}
