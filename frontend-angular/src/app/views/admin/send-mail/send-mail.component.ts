import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-admin-send-mail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatButtonToggleModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-content>
          <div class="actions-row mb-3">
            <button mat-raised-button color="primary" (click)="send()">发送</button>
          </div>

          <div class="mb-3">
            <p class="label">你的名称和地址，名称不填写则使用邮箱地址</p>
            <div class="row">
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>名称</mat-label>
                <input matInput [(ngModel)]="model.fromName">
              </mat-form-field>
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>邮箱地址</mat-label>
                <input matInput [(ngModel)]="model.fromMail">
              </mat-form-field>
            </div>
          </div>

          <div class="mb-3">
            <p class="label">收件人名称和地址，名称不填写则使用邮箱地址</p>
            <div class="row">
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>名称</mat-label>
                <input matInput [(ngModel)]="model.toName">
              </mat-form-field>
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>邮箱地址</mat-label>
                <input matInput [(ngModel)]="model.toMail">
              </mat-form-field>
            </div>
          </div>

          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>主题</mat-label>
            <input matInput [(ngModel)]="model.subject">
          </mat-form-field>

          <div class="mb-3">
            <p class="label">选项</p>
            <mat-button-toggle-group [(ngModel)]="model.contentType">
              <mat-button-toggle value="text">文本</mat-button-toggle>
              <mat-button-toggle value="html">HTML</mat-button-toggle>
            </mat-button-toggle-group>
            @if (model.contentType !== 'text') {
              <button mat-button (click)="isPreview.set(!isPreview())">
                {{ isPreview() ? '编辑' : '预览' }}
              </button>
            }
          </div>

          <div class="mb-3">
            <p class="label">内容</p>
            @if (isPreview()) {
              <div class="preview-box" [innerHTML]="model.content"></div>
            } @else {
              <mat-form-field appearance="outline" class="full-width">
                <textarea matInput [(ngModel)]="model.content" rows="10"></textarea>
              </mat-form-field>
            }
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
    .row { display: flex; gap: 8px; }
    .flex-grow { flex: 1; }
    .label { font-size: 14px; color: #666; margin-bottom: 8px; }
    .actions-row { display: flex; justify-content: flex-end; }
    .preview-box { border: 1px solid #ccc; padding: 16px; border-radius: 4px; min-height: 200px; background: #fafafa; }
  `]
})
export class AdminSendMailComponent {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  isPreview = signal(false);
  model = {
    fromName: '',
    fromMail: '',
    toName: '',
    toMail: '',
    subject: '',
    contentType: 'text',
    content: ''
  };

  async send() {
    try {
      await this.api.fetch('/admin/send_mail', {
        method: 'POST',
        body: {
          from_name: this.model.fromName,
          from_mail: this.model.fromMail,
          to_name: this.model.toName,
          to_mail: this.model.toMail,
          subject: this.model.subject,
          is_html: this.model.contentType !== 'text',
          content: this.model.content
        }
      });
      this.model = { fromName: '', fromMail: '', toName: '', toMail: '', subject: '', contentType: 'text', content: '' };
      this.snackbar.success('请查看您的发件箱, 如果失败, 请检查稍后重试。');
    } catch (error: any) {
      this.snackbar.error(error.message || '发送失败');
    }
  }
}
