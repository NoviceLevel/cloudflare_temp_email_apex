import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-attachments',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    TranslateModule,
  ],
  template: `
    <div class="attachments-container">
      <div class="attachments-header">
        <h2>{{ 'attachments' | translate }}</h2>
        <button mat-icon-button (click)="refresh()">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <div class="attachments-content">
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (attachments().length === 0) {
          <div class="empty-state">
            <mat-icon>attachment</mat-icon>
            <h3>{{ 'noAttachments' | translate }}</h3>
            <p>{{ 'noAttachmentsDesc' | translate }}</p>
          </div>
        } @else {
          <div class="attachments-grid">
            @for (attachment of attachments(); track attachment.key) {
              <mat-card class="attachment-card">
                <mat-card-content>
                  <mat-icon class="file-icon">insert_drive_file</mat-icon>
                  <div class="attachment-info">
                    <span class="attachment-name">{{ attachment.key }}</span>
                    <span class="attachment-size">{{ formatSize(attachment.size) }}</span>
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-button (click)="download(attachment)">
                    <mat-icon>download</mat-icon>
                    {{ 'download' | translate }}
                  </button>
                  <button mat-button color="warn" (click)="delete(attachment)">
                    <mat-icon>delete</mat-icon>
                    {{ 'delete' | translate }}
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .attachments-container {
      padding: 16px;
    }

    .attachments-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .attachments-header h2 {
      margin: 0;
      font-weight: 400;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: #5f6368;
    }
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .attachments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px;
    }

    .attachment-card {
      cursor: pointer;
    }
    .attachment-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }
    .file-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #5f6368;
    }
    .attachment-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .attachment-name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .attachment-size {
      font-size: 12px;
      color: #5f6368;
    }
  `]
})
export class AttachmentsComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  attachments = signal<any[]>([]);
  loading = signal(false);

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    try {
      const res = await this.api.fetch<{ results: any[] }>('/api/attachment');
      this.attachments.set(res.results || []);
    } catch (error: any) {
      // S3 might not be configured
      this.attachments.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async download(attachment: any) {
    try {
      const res = await this.api.fetch<{ url: string }>(`/api/attachment/${attachment.key}`);
      window.open(res.url, '_blank');
    } catch (error: any) {
      this.snackbar.error(error.message || 'Download failed');
    }
  }

  async delete(attachment: any) {
    try {
      await this.api.fetch(`/api/attachment/${attachment.key}`, { method: 'DELETE' });
      this.snackbar.success('Attachment deleted');
      await this.refresh();
    } catch (error: any) {
      this.snackbar.error(error.message || 'Delete failed');
    }
  }
}
