import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SnackbarService } from '../../services/snackbar.service';
import { utcToLocalDate } from '../../utils';

interface SendMailItem {
  id: number;
  address: string;
  to_mail: string;
  subject: string;
  is_html: boolean;
  content: string;
  raw: string;
  created_at: string;
  checked?: boolean;
}

@Component({
  selector: 'app-sendbox',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatListModule, MatChipsModule,
    MatPaginatorModule, MatIconModule, MatCheckboxModule, MatDialogModule, MatProgressBarModule
  ],
  template: `
    <div class="sendbox-container">
      <div class="toolbar">
        @if (multiActionMode()) {
          <button mat-stroked-button (click)="multiActionMode.set(false)">取消多选</button>
          <button mat-stroked-button (click)="selectAll(true)">全选本页</button>
          <button mat-stroked-button (click)="selectAll(false)">取消全选</button>
          @if (enableUserDeleteEmail) {
            <button mat-stroked-button color="warn" (click)="openMultiDeleteDialog()">删除</button>
          }
        } @else {
          @if (showMultiActionMode()) {
            <button mat-stroked-button color="primary" (click)="multiActionMode.set(true)">多选</button>
          }
          <button mat-stroked-button color="primary" (click)="refresh()">刷新</button>
        }
      </div>
      <mat-paginator [length]="count()" [pageSize]="pageSize()" [pageSizeOptions]="[20, 50, 100]"
        [pageIndex]="page() - 1" (page)="onPageChange($event)" showFirstLastButtons></mat-paginator>
      @if (!isMobile) {
        <div class="desktop-view">
          <div class="mail-list">
            <mat-list>
              @for (row of data(); track row.id) {
                <mat-list-item [class.selected]="curMail()?.id === row.id" (click)="clickRow(row)">
                  @if (multiActionMode()) {
                    <mat-checkbox [(ngModel)]="row.checked" (click)="$event.stopPropagation()"></mat-checkbox>
                  }
                  <div matListItemTitle>{{ row.subject }}</div>
                  <div matListItemLine>
                    <mat-chip-set>
                      <mat-chip>ID: {{ row.id }}</mat-chip>
                      <mat-chip>{{ formatDate(row.created_at) }}</mat-chip>
                      @if (showEMailFrom) { <mat-chip>FROM: {{ row.address }}</mat-chip> }
                      <mat-chip>TO: {{ row.to_mail }}</mat-chip>
                    </mat-chip-set>
                  </div>
                </mat-list-item>
              }
            </mat-list>
          </div>
          <div class="mail-content">
            @if (curMail()) {
              <mat-card appearance="outlined">
                <mat-card-header><mat-card-title>{{ curMail()!.subject }}</mat-card-title></mat-card-header>
                <mat-card-content>
                  <div class="mail-meta">
                    <mat-chip-set>
                      <mat-chip>ID: {{ curMail()!.id }}</mat-chip>
                      <mat-chip>{{ formatDate(curMail()!.created_at) }}</mat-chip>
                      <mat-chip>FROM: {{ curMail()!.address }}</mat-chip>
                      <mat-chip>TO: {{ curMail()!.to_mail }}</mat-chip>
                    </mat-chip-set>
                    <button mat-button color="primary" (click)="showCode.set(!showCode())">切换查看元数据</button>
                    @if (enableUserDeleteEmail) {
                      <button mat-button color="warn" (click)="openDeleteDialog()">删除</button>
                    }
                  </div>
                  @if (showCode()) {
                    <pre class="code-view">{{ curMail()!.raw }}</pre>
                  } @else if (!curMail()!.is_html) {
                    <pre class="text-view">{{ curMail()!.content }}</pre>
                  } @else {
                    <div [innerHTML]="curMail()!.content" class="html-view"></div>
                  }
                </mat-card-content>
              </mat-card>
            } @else {
              <div class="empty-state"><mat-icon>email</mat-icon><p>请选择一封邮件查看。</p></div>
            }
          </div>
        </div>
      } @else {
        <div class="mobile-view">
          <mat-list>
            @for (row of data(); track row.id) {
              <mat-list-item (click)="clickRow(row)">
                <div matListItemTitle>{{ row.subject }}</div>
                <div matListItemLine>
                  <mat-chip-set><mat-chip>ID: {{ row.id }}</mat-chip><mat-chip>{{ formatDate(row.created_at) }}</mat-chip></mat-chip-set>
                </div>
              </mat-list-item>
            }
          </mat-list>
        </div>
      }
    </div>
  `,
  styles: [`
    .sendbox-container { text-align: left; }
    .toolbar { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .desktop-view { display: flex; gap: 16px; }
    .mail-list { width: 40%; max-height: 80vh; overflow: auto; }
    .mail-content { flex: 1; max-height: 100vh; overflow: auto; }
    .selected { background-color: rgba(25, 118, 210, 0.1); }
    mat-list-item { cursor: pointer; }
    .mail-meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px; }
    .code-view, .text-view { white-space: pre-wrap; word-wrap: break-word; background: #f5f5f5; padding: 16px; border-radius: 4px; }
    .html-view { padding: 16px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: #666; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    :host-context(.dark-theme) .code-view, :host-context(.dark-theme) .text-view { background: #333; }
  `]
})
export class SendboxComponent implements OnInit {
  @Input() enableUserDeleteEmail = false;
  @Input() showEMailFrom = false;
  @Input() fetchMailData!: (limit: number, offset: number) => Promise<{ results: any[]; count: number }>;
  @Input() deleteMailFn?: (id: number) => Promise<void>;

  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  isMobile = window.innerWidth < 768;
  data = signal<SendMailItem[]>([]);
  count = signal(0);
  page = signal(1);
  pageSize = signal(20);
  curMail = signal<SendMailItem | null>(null);
  showCode = signal(false);
  multiActionMode = signal(false);

  showMultiActionMode = computed(() => this.enableUserDeleteEmail);

  async ngOnInit() { await this.refresh(); }

  formatDate(date: string): string {
    const useUTCDate = localStorage.getItem('useUTCDate') === 'true';
    return utcToLocalDate(date, useUTCDate);
  }

  async refresh() {
    try {
      const { results, count } = await this.fetchMailData(this.pageSize(), (this.page() - 1) * this.pageSize());
      const parsedResults = results.map((item: any) => {
        try {
          const mailData = JSON.parse(item.raw);
          if (mailData.version === 'v2') {
            item.to_mail = mailData.to_name ? `${mailData.to_name} <${mailData.to_mail}>` : mailData.to_mail;
            item.subject = mailData.subject;
            item.is_html = mailData.is_html;
            item.content = mailData.content;
            item.raw = JSON.stringify(mailData, null, 2);
          } else {
            item.to_mail = mailData?.personalizations?.map((p: any) => p.to?.map((t: any) => t.email).join(',')).join(';');
            item.subject = mailData.subject;
            item.is_html = mailData.content[0]?.type !== 'text/plain';
            item.content = mailData.content[0]?.value;
            item.raw = JSON.stringify(mailData, null, 2);
          }
        } catch (error) { console.log(error); }
        return item;
      });
      this.data.set(parsedResults);
      if (count > 0) this.count.set(count);
      if (!this.isMobile && !this.curMail() && parsedResults.length > 0) this.curMail.set(parsedResults[0]);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.refresh();
  }

  clickRow(row: SendMailItem) { this.curMail.set(row); }
  selectAll(checked: boolean) { this.data.update(items => items.map(item => ({ ...item, checked }))); }

  openDeleteDialog() {
    const dialogRef = this.dialog.open(SendboxConfirmDialogComponent, { width: '320px', data: { message: '确定要删除邮件吗?' } });
    dialogRef.afterClosed().subscribe(result => { if (result) this.deleteMail(); });
  }

  openMultiDeleteDialog() {
    const selectedMails = this.data().filter(item => item.checked);
    if (selectedMails.length === 0) { this.snackbar.error('请选择邮件'); return; }
    const dialogRef = this.dialog.open(SendboxMultiDeleteDialogComponent, {
      width: '400px',
      data: { selectedMails, deleteMailFn: this.deleteMailFn }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.refresh(); });
  }

  async deleteMail() {
    if (!this.deleteMailFn || !this.curMail()) return;
    try {
      await this.deleteMailFn(this.curMail()!.id);
      this.snackbar.success('成功');
      this.curMail.set(null);
      await this.refresh();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}

// Confirm Dialog
@Component({
  selector: 'app-sendbox-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">确认</button>
    </mat-dialog-actions>
  `
})
export class SendboxConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Multi Delete Dialog
@Component({
  selector: 'app-sendbox-multi-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressBarModule],
  template: `
    <mat-dialog-content>
      <p>确定要删除邮件吗?</p>
      @if (isDeleting) {
        <mat-progress-bar mode="determinate" [value]="progress"></mat-progress-bar>
        <p>{{ current }}/{{ data.selectedMails.length }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="isDeleting">取消</button>
      <button mat-raised-button color="warn" (click)="deleteAll()" [disabled]="isDeleting">确认</button>
    </mat-dialog-actions>
  `
})
export class SendboxMultiDeleteDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef);
  private snackbar = inject(SnackbarService);

  isDeleting = false;
  progress = 0;
  current = 0;

  async deleteAll() {
    this.isDeleting = true;
    const selectedMails = this.data.selectedMails;
    for (let i = 0; i < selectedMails.length; i++) {
      try {
        await this.data.deleteMailFn(selectedMails[i].id);
      } catch (error) { console.error(error); }
      this.current = i + 1;
      this.progress = Math.floor((i + 1) / selectedMails.length * 100);
    }
    this.snackbar.success('成功');
    this.dialogRef.close(true);
  }
}

import { MatDialogRef } from '@angular/material/dialog';
