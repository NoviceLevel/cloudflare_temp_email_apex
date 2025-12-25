import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

interface AttachmentRow {
  key: string;
}

@Component({
  selector: 'app-attachment',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatDialogModule, MatChipsModule, MatIconModule],
  template: `
    <div class="attachment-container">
      <table mat-table [dataSource]="data()" class="full-width">
        <ng-container matColumnDef="key">
          <th mat-header-cell *matHeaderCellDef>键</th>
          <td mat-cell *matCellDef="let row">{{ row.key }}</td>
        </ng-container>
        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>操作</th>
          <td mat-cell *matCellDef="let row">
            <button mat-button color="primary" (click)="downloadAttachment(row)">下载</button>
            <button mat-button color="warn" (click)="confirmDelete(row)">删除</button>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .attachment-container { padding: 16px; }
    .full-width { width: 100%; }
  `]
})
export class AttachmentComponent implements OnInit {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  displayedColumns = ['key', 'action'];
  data = signal<AttachmentRow[]>([]);
  curRow = signal<AttachmentRow | null>(null);

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const { results } = await this.api.fetch<{ results: AttachmentRow[] }>('/api/attachment/list');
      this.data.set(results || []);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async downloadAttachment(row: AttachmentRow) {
    try {
      const { url } = await this.api.fetch<{ url: string }>('/api/attachment/get_url', {
        method: 'POST',
        body: { key: row.key },
      });
      this.dialog.open(AttachmentDownloadDialogComponent, {
        width: '400px',
        data: { key: row.key, url }
      });
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  confirmDelete(row: AttachmentRow) {
    this.curRow.set(row);
    const dialogRef = this.dialog.open(AttachmentDeleteDialogComponent, { width: '320px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.deleteAttachment();
    });
  }

  async deleteAttachment() {
    try {
      await this.api.fetch('/api/attachment/delete', {
        method: 'POST',
        body: { key: this.curRow()?.key },
      });
      this.snackbar.success('删除成功');
      await this.fetchData();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}

// Download Dialog
@Component({
  selector: 'app-attachment-download-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatChipsModule],
  template: `
    <h2 mat-dialog-title>下载</h2>
    <mat-dialog-content>
      <mat-chip color="primary" highlighted class="mb-3">{{ data.key }}</mat-chip>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>关闭</button>
      <a mat-raised-button color="primary" [href]="data.url" target="_blank" [download]="data.key?.replace('/', '_')">下载</a>
    </mat-dialog-actions>
  `,
  styles: [`.mb-3 { margin-bottom: 12px; }`]
})
export class AttachmentDownloadDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Delete Confirm Dialog
@Component({
  selector: 'app-attachment-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>删除</h2>
    <mat-dialog-content>确定要删除此附件吗？</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">删除</button>
    </mat-dialog-actions>
  `
})
export class AttachmentDeleteDialogComponent {}
