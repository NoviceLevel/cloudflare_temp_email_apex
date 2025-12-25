import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SnackbarService } from '../../services/snackbar.service';

interface AiExtract {
  type: string;
  result: string;
  result_text?: string;
}

@Component({
  selector: 'app-ai-extract-info',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    TranslateModule,
  ],
  template: `
    @if (getAiExtract(); as extract) {
      @if (!compact) {
        <div class="alert-success">
          <div class="alert-header">
            <mat-icon>{{ getTypeIcon(extract) }}</mat-icon>
            <span class="alert-title">{{ getTypeLabel(extract) }}</span>
          </div>
          <div class="alert-content">
            @if (extract.type === 'auth_code') {
              <span class="auth-code">{{ extract.result }}</span>
            } @else {
              <span class="link-text">{{ getDisplayText(extract) }}</span>
            }
            <button mat-icon-button (click)="copyToClipboard(extract)">
              <mat-icon>content_copy</mat-icon>
            </button>
            @if (extract.type !== 'auth_code') {
              <button mat-button color="primary" (click)="openLink(extract)">
                {{ 'open' | translate }}
              </button>
            }
          </div>
        </div>
      } @else {
        <mat-chip color="primary" highlighted (click)="copyToClipboard(extract)" class="clickable">
          <mat-icon>{{ getTypeIcon(extract) }}</mat-icon>
          <span class="chip-text">{{ getTypeLabel(extract) }}: {{ getDisplayText(extract) }}</span>
        </mat-chip>
      }
    }
  `,
  styles: [`
    .alert-success {
      background: #e8f5e9;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 10px;
    }
    :host-context(.dark-theme) .alert-success {
      background: #1b5e20;
    }
    .alert-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #2e7d32;
    }
    :host-context(.dark-theme) .alert-header {
      color: #a5d6a7;
    }
    .alert-title {
      font-weight: 500;
    }
    .alert-content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .auth-code {
      font-size: 1.25rem;
      font-weight: bold;
      font-family: monospace;
    }
    .link-text {
      max-width: 400px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .clickable {
      cursor: pointer;
    }
    .chip-text {
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class AiExtractInfoComponent {
  @Input() metadata: string | null = null;
  @Input() compact = false;

  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  getAiExtract(): AiExtract | null {
    if (!this.metadata) return null;
    try {
      const data = JSON.parse(this.metadata);
      return data.ai_extract || null;
    } catch (e) {
      return null;
    }
  }

  getTypeLabel(extract: AiExtract): string {
    const typeMap: Record<string, string> = {
      auth_code: this.translate.instant('authCode') || '验证码',
      auth_link: this.translate.instant('authLink') || '认证链接',
      service_link: this.translate.instant('serviceLink') || '服务链接',
      subscription_link: this.translate.instant('subscriptionLink') || '订阅链接',
      other_link: this.translate.instant('otherLink') || '其他链接',
    };
    return typeMap[extract.type] || '';
  }

  getTypeIcon(extract: AiExtract): string {
    const iconMap: Record<string, string> = {
      auth_code: 'password',
      auth_link: 'verified_user',
      service_link: 'link',
      subscription_link: 'subscriptions',
      other_link: 'link',
    };
    return iconMap[extract.type] || 'link';
  }

  getDisplayText(extract: AiExtract): string {
    if (extract.type === 'auth_code') {
      return extract.result;
    }
    return extract.result_text || extract.result;
  }

  async copyToClipboard(extract: AiExtract) {
    try {
      await navigator.clipboard.writeText(extract.result);
      this.snackbar.success(this.translate.instant('copySuccess') || '复制成功');
    } catch (e) {
      this.snackbar.error(this.translate.instant('copyFailed') || '复制失败');
    }
  }

  openLink(extract: AiExtract) {
    if (extract.type !== 'auth_code' && extract.result) {
      window.open(extract.result, '_blank');
    }
  }
}
