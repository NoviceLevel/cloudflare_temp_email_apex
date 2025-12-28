import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

import { ParsedMail } from '../../utils/email-parser';
import { GlobalStateService } from '../../services/global-state.service';
import { ShadowHtmlComponent } from '../shadow-html/shadow-html.component';
import { AiExtractInfoComponent } from '../ai-extract-info/ai-extract-info.component';

@Component({
  selector: 'app-mail-view',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatMenuModule, MatDividerModule, TranslateModule, ShadowHtmlComponent, AiExtractInfoComponent,
  ],
  template: `
    <div class="mail-view">
      <!-- Header -->
      <div class="view-header">
        <button class="back-btn" (click)="onBack.emit()">
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <div class="header-actions">
          <button class="action-btn" (click)="onDelete.emit(mail.id)" matTooltip="删除">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
          <button class="action-btn" [matMenuTriggerFor]="moreMenu" matTooltip="更多">
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
          </button>
          <mat-menu #moreMenu="matMenu">
            <button mat-menu-item (click)="downloadEml()"><mat-icon>download</mat-icon>下载 (.eml)</button>
          </mat-menu>
        </div>
      </div>

      <!-- Subject -->
      <h1 class="subject">{{ mail.subject || '(无主题)' }}</h1>

      <!-- AI Extract -->
      @if (mail.metadata) {
        <app-ai-extract-info [metadata]="mail.metadata"></app-ai-extract-info>
      }

      <!-- Sender -->
      <div class="sender-row">
        <div class="avatar">{{ getInitial() }}</div>
        <div class="sender-info">
          <div class="sender-name">
            {{ getSenderName() }}
            <span class="sender-email">&lt;{{ getSenderEmail() }}&gt;</span>
          </div>
          <div class="recipient">收件人：{{ mail.address || '我' }}</div>
        </div>
        <div class="mail-time">{{ formatDate(mail.created_at) }}</div>
      </div>

      <mat-divider></mat-divider>

      <!-- Body -->
      <div class="mail-body">
        @if (mail.message && mail.message.includes('<')) {
          <app-shadow-html [htmlContent]="mail.message"></app-shadow-html>
        } @else {
          <pre class="text-body">{{ mail.text || mail.message }}</pre>
        }
      </div>

      <!-- Attachments -->
      @if (mail.attachments && mail.attachments.length > 0) {
        <div class="attachments">
          <div class="attachments-header">
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#5f6368" d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 015 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 005 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/></svg>
            {{ mail.attachments.length }} 个附件
          </div>
          <div class="attachment-list">
            @for (att of mail.attachments; track att.filename) {
              <div class="attachment-item" (click)="downloadAttachment(att)">
                <svg width="24" height="24" viewBox="0 0 24 24"><path fill="#5f6368" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                <div class="att-info">
                  <div class="att-name">{{ att.filename }}</div>
                  <div class="att-size">{{ att.size }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mail-view { padding: 0 24px 24px; height: 100%; overflow-y: auto; }
    .view-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; position: sticky; top: 0; background: inherit; z-index: 10; }
    .back-btn, .action-btn { width: 40px; height: 40px; border: none; background: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5f6368; }
    .back-btn:hover, .action-btn:hover { background: rgba(0,0,0,0.04); }
    :host-context(.dark) .back-btn, :host-context(.dark) .action-btn { color: #9aa0a6; }
    :host-context(.dark) .back-btn:hover, :host-context(.dark) .action-btn:hover { background: rgba(255,255,255,0.08); }
    .header-actions { display: flex; gap: 4px; }

    .subject { font-size: 22px; font-weight: 400; margin: 0 0 16px; line-height: 1.4; color: #202124; }
    :host-context(.dark) .subject { color: #e8eaed; }

    .sender-row { display: flex; align-items: flex-start; gap: 12px; padding: 16px 0; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 500; flex-shrink: 0; }
    .sender-info { flex: 1; min-width: 0; }
    .sender-name { font-size: 14px; font-weight: 500; color: #202124; }
    :host-context(.dark) .sender-name { color: #e8eaed; }
    .sender-email { font-weight: 400; color: #5f6368; margin-left: 4px; }
    :host-context(.dark) .sender-email { color: #9aa0a6; }
    .recipient { font-size: 12px; color: #5f6368; margin-top: 2px; }
    :host-context(.dark) .recipient { color: #9aa0a6; }
    .mail-time { font-size: 12px; color: #5f6368; white-space: nowrap; }
    :host-context(.dark) .mail-time { color: #9aa0a6; }

    .mail-body { padding: 16px 0; min-height: 200px; }
    .text-body { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; margin: 0; font-size: 14px; line-height: 1.6; color: #202124; }
    :host-context(.dark) .text-body { color: #e8eaed; }

    .attachments { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
    :host-context(.dark) .attachments { border-color: #3c4043; }
    .attachments-header { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #5f6368; margin-bottom: 12px; }
    .attachment-list { display: flex; flex-wrap: wrap; gap: 8px; }
    .attachment-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #dadce0; border-radius: 8px; cursor: pointer; max-width: 200px; }
    .attachment-item:hover { background: #f1f3f4; }
    :host-context(.dark) .attachment-item { border-color: #5f6368; }
    :host-context(.dark) .attachment-item:hover { background: #3c4043; }
    .att-info { overflow: hidden; }
    .att-name { font-size: 13px; color: #202124; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    :host-context(.dark) .att-name { color: #e8eaed; }
    .att-size { font-size: 11px; color: #5f6368; }
  `]
})
export class MailViewComponent {
  @Input() mail!: ParsedMail;
  @Output() onBack = new EventEmitter<void>();
  @Output() onDelete = new EventEmitter<number>();

  state = inject(GlobalStateService);

  getInitial(): string {
    const name = this.getSenderName();
    return name.charAt(0).toUpperCase();
  }

  getSenderName(): string {
    if (!this.mail.source) return '未知';
    const match = this.mail.source.match(/^([^<]+)/);
    return match ? match[1].trim() : this.mail.source.split('@')[0];
  }

  getSenderEmail(): string {
    if (!this.mail.source) return '';
    const match = this.mail.source.match(/<([^>]+)>/);
    return match ? match[1] : this.mail.source;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString([], { 
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  downloadAttachment(att: any) {
    if (att.url) {
      const a = document.createElement('a');
      a.href = att.url;
      a.download = att.filename || 'attachment';
      a.click();
    }
  }

  downloadEml() {
    if (this.mail.raw) {
      const blob = new Blob([this.mail.raw], { type: 'message/rfc822' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.mail.subject || 'email'}.eml`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}
