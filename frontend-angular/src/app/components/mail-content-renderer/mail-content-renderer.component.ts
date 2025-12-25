import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

import { ParsedMail } from '../../utils/email-parser';
import { getDownloadEmlUrl } from '../../utils/email-parser';
import { utcToLocalDate } from '../../utils/index';
import { AiExtractInfoComponent } from '../ai-extract-info/ai-extract-info.component';
import { ShadowHtmlComponent } from '../shadow-html/shadow-html.component';
import { GlobalStateService } from '../../services/global-state.service';

@Component({
  selector: 'app-mail-content-renderer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatDialogModule,
    MatCardModule,
    TranslateModule,
    AiExtractInfoComponent,
    ShadowHtmlComponent,
  ],
  template: `
    <div class="mail-renderer">
      <!-- Mail Info -->
      <div class="mail-info">
        <div class="info-row">
          <span class="label">{{ 'from' | translate }}:</span>
          <span class="value">{{ mail.source }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ 'time' | translate }}:</span>
          <span class="value">{{ formatDate(mail.created_at) }}</span>
        </div>
        @if (showEMailTo) {
          <div class="info-row">
            <span class="label">{{ 'to' | translate }}:</span>
            <span class="value">{{ mail.address }}</span>
          </div>
        }
        <div class="info-row">
          <span class="label">{{ 'subject' | translate }}:</span>
          <span class="value">{{ mail.subject }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="mail-actions">
        @if (enableUserDeleteEmail) {
          <button mat-stroked-button color="warn" (click)="openDeleteDialog()">
            <mat-icon>delete</mat-icon>
            {{ 'delete' | translate }}
          </button>
        }
        <button mat-stroked-button (click)="downloadMail()">
          <mat-icon>download</mat-icon>
          {{ 'downloadMail' | translate }}
        </button>
        @if (showReply) {
          <button mat-stroked-button (click)="onReply.emit()">
            <mat-icon>reply</mat-icon>
            {{ 'reply' | translate }}
          </button>
          <button mat-stroked-button (click)="onForward.emit()">
            <mat-icon>forward</mat-icon>
            {{ 'forward' | translate }}
          </button>
        }
        <button mat-stroked-button (click)="toggleShowText()">
          {{ showText() ? ('showHtmlMail' | translate) : ('showTextMail' | translate) }}
        </button>
        <button mat-stroked-button (click)="openFullscreenDialog()">
          <mat-icon>fullscreen</mat-icon>
          {{ 'fullscreen' | translate }}
        </button>
        @if (mail.attachments && mail.attachments.length > 0) {
          <button mat-stroked-button (click)="openAttachmentsDialog()">
            <mat-icon>attachment</mat-icon>
            {{ 'attachments' | translate }}
          </button>
        }
      </div>

      <!-- AI Extract Info -->
      <app-ai-extract-info [metadata]="mail.metadata || null"></app-ai-extract-info>

      <!-- Mail Body -->
      <div class="mail-body">
        @if (showText()) {
          <pre class="text-content">{{ mail.text }}</pre>
        } @else if (globalState.useIframeShowMail()) {
          <iframe [srcdoc]="mail.message" class="mail-iframe"></iframe>
        } @else {
          <app-shadow-html [htmlContent]="mail.message || ''" class="mail-html"></app-shadow-html>
        }
      </div>
    </div>
  `,
  styles: [`
    .mail-renderer {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .mail-info {
      background: rgba(0, 0, 0, 0.04);
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    :host-context(.dark-theme) .mail-info {
      background: rgba(255, 255, 255, 0.08);
    }
    .info-row {
      display: flex;
      margin-bottom: 4px;
      font-size: 14px;
    }
    .label {
      min-width: 70px;
      color: var(--mat-sys-on-surface-variant, #666);
      font-weight: 500;
    }
    .value {
      flex: 1;
      word-break: break-all;
    }
    .mail-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .mail-body {
      margin-top: 10px;
      flex: 1;
    }
    .text-content {
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
      padding: 0;
    }
    .mail-iframe {
      width: 100%;
      height: 100%;
      border: none;
      min-height: 400px;
    }
    .mail-html {
      width: 100%;
      height: 100%;
    }
    /* Fullscreen overlay */
    .fullscreen-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #fff;
      z-index: 9999;
      display: flex;
      flex-direction: column;
    }
    :host-context(.dark-theme) .fullscreen-overlay {
      background: #121212;
      color: #fff;
    }
    .fullscreen-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #ccc;
    }
    :host-context(.dark-theme) .fullscreen-header {
      border-bottom-color: #444;
    }
    .fullscreen-title {
      flex: 1;
      font-size: 18px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .fullscreen-body {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }
  `]
})
export class MailContentRendererComponent {
  @Input() mail!: ParsedMail;
  @Input() enableUserDeleteEmail = false;
  @Input() showReply = false;
  @Input() showEMailTo = true;
  @Input() showSaveS3 = false;
  @Output() onDelete = new EventEmitter<void>();
  @Output() onReply = new EventEmitter<void>();
  @Output() onForward = new EventEmitter<void>();
  @Output() onSaveToS3 = new EventEmitter<{filename: string, blob: Blob}>();

  globalState = inject(GlobalStateService);
  private dialog = inject(MatDialog);

  showText = signal(false);

  formatDate(date: string): string {
    return utcToLocalDate(date, this.globalState.useUTCDate());
  }

  toggleShowText() {
    this.showText.update(v => !v);
  }

  downloadMail() {
    const url = getDownloadEmlUrl(this.mail.raw);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mail-${this.mail.id}.eml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  openFullscreenDialog() {
    this.dialog.open(MailFullscreenDialogComponent, {
      data: { 
        mail: this.mail, 
        showText: this.showText(),
        useIframeShowMail: this.globalState.useIframeShowMail()
      },
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'fullscreen-dialog'
    });
  }

  openAttachmentsDialog() {
    this.dialog.open(MailAttachmentsDialogComponent, {
      data: { attachments: this.mail.attachments, showSaveS3: this.showSaveS3 },
      width: '500px',
    });
  }

  openDeleteDialog() {
    const dialogRef = this.dialog.open(MailDeleteDialogComponent, {
      width: '320px',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onDelete.emit();
      }
    });
  }
}

import { MAT_DIALOG_DATA } from '@angular/material/dialog';

// Attachments Dialog Component
@Component({
  selector: 'app-mail-attachments-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatListModule, MatChipsModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'attachments' | translate }}</h2>
    <mat-dialog-content>
      <mat-list>
        @for (att of data.attachments; track att.id) {
          <mat-list-item>
            <span matListItemTitle>{{ att.filename }}</span>
            <span matListItemLine>
              <mat-chip size="small">{{ att.size }}</mat-chip>
            </span>
            <a mat-icon-button [href]="att.url" [download]="att.filename" matListItemMeta>
              <mat-icon>download</mat-icon>
            </a>
          </mat-list-item>
        }
      </mat-list>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'close' | translate }}</button>
    </mat-dialog-actions>
  `
})
export class MailAttachmentsDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Delete Confirm Dialog Component
@Component({
  selector: 'app-mail-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, TranslateModule],
  template: `
    <div class="delete-dialog">
      <mat-icon color="warn">delete_outline</mat-icon>
      <h3>{{ 'delete' | translate }}</h3>
      <p>{{ 'deleteMailTip' | translate }}</p>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
        <button mat-button color="warn" [mat-dialog-close]="true">{{ 'delete' | translate }}</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .delete-dialog {
      text-align: center;
      padding: 16px;
    }
    .delete-dialog mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    .delete-dialog h3 {
      margin: 16px 0 8px;
    }
    .delete-dialog p {
      color: #666;
      margin-bottom: 16px;
    }
  `]
})
export class MailDeleteDialogComponent {}

// Fullscreen Dialog Component
@Component({
  selector: 'app-mail-fullscreen-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, ShadowHtmlComponent],
  template: `
    <div class="fullscreen-dialog-container">
      <div class="fullscreen-header">
        <span class="fullscreen-title">{{ data.mail.subject }}</span>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="fullscreen-body">
        @if (data.showText) {
          <pre class="text-content">{{ data.mail.text }}</pre>
        } @else if (data.useIframeShowMail) {
          <iframe [srcdoc]="data.mail.message" class="mail-iframe"></iframe>
        } @else {
          <app-shadow-html [htmlContent]="data.mail.message || ''" class="mail-html"></app-shadow-html>
        }
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-dialog-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }
    .fullscreen-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #ccc;
      flex-shrink: 0;
    }
    :host-context(.dark-theme) .fullscreen-header {
      border-bottom-color: #444;
    }
    .fullscreen-title {
      flex: 1;
      font-size: 18px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 8px;
    }
    .fullscreen-body {
      flex: 1;
      overflow: auto;
      padding: 16px;
    }
    .text-content {
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
      padding: 0;
    }
    .mail-iframe {
      width: 100%;
      height: 100%;
      border: none;
      min-height: calc(100vh - 80px);
    }
    .mail-html {
      width: 100%;
      height: 100%;
    }
  `]
})
export class MailFullscreenDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}
