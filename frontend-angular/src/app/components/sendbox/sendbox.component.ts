import { Component, Input, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
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
    MatPaginatorModule, MatIconModule, MatCheckboxModule, MatDialogModule, MatProgressBarModule,
    MatFormFieldModule, MatInputModule, TranslateModule
  ],
  template: `
    <div class="sendbox-container">
      @if (!isMobile()) {
        <!-- Desktop Toolbar -->
        <div class="toolbar">
          @if (multiActionMode()) {
            <button mat-stroked-button (click)="multiActionMode.set(false)">{{ 'cancel' | translate }}</button>
            <button mat-stroked-button (click)="selectAll(true)">{{ 'selectAll' | translate }}</button>
            <button mat-stroked-button (click)="selectAll(false)">{{ 'deselectAll' | translate }}</button>
            @if (enableUserDeleteEmail) {
              <button mat-stroked-button color="warn" (click)="openMultiDeleteDialog()">{{ 'delete' | translate }}</button>
            }
          } @else {
            @if (showMultiActionMode()) {
              <button mat-stroked-button color="primary" (click)="multiActionMode.set(true)">{{ 'multiSelect' | translate }}</button>
            }
            <button mat-stroked-button color="primary" (click)="refresh()">{{ 'refresh' | translate }}</button>
            <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
              <mat-label>{{ 'filter' | translate }}</mat-label>
              <input matInput [(ngModel)]="filterKeyword" [placeholder]="'searchMails' | translate">
            </mat-form-field>
          }
        </div>

        <!-- Desktop View -->
        <div class="mail-layout">
          <div class="mail-list">
            @if (filteredData().length === 0) {
              <div class="empty-state"><mat-icon>inbox</mat-icon><p>{{ 'noMails' | translate }}</p></div>
            } @else {
              <mat-nav-list>
                @for (row of filteredData(); track row.id) {
                  <mat-list-item [class.selected]="curMail()?.id === row.id" (click)="clickRow(row)">
                    @if (multiActionMode()) {
                      <mat-checkbox [(ngModel)]="row.checked" (click)="$event.stopPropagation()"></mat-checkbox>
                    }
                    <div matListItemTitle class="mail-subject">{{ row.subject }}</div>
                    <div matListItemLine class="mail-meta">
                      <span class="mail-id">ID: {{ row.id }}</span>
                      <span class="mail-date">{{ formatDate(row.created_at) }}</span>
                    </div>
                    <div matListItemLine class="mail-from">TO: {{ row.to_mail }}</div>
                  </mat-list-item>
                }
              </mat-nav-list>
            }
            <mat-paginator [length]="count()" [pageSize]="pageSize()" [pageSizeOptions]="[10, 20, 50]"
              [pageIndex]="page() - 1" (page)="onPageChange($event)" showFirstLastButtons></mat-paginator>
          </div>
          <div class="mail-content">
            @if (curMail()) {
              <div class="mail-header">
                <h2>{{ curMail()!.subject }}</h2>
                <div class="mail-actions">
                  @if (showMultiActionMode()) {
                    <button mat-button (click)="multiActionMode.set(true)">{{ 'multiSelect' | translate }}</button>
                  }
                </div>
              </div>
              <mat-card appearance="outlined">
                <mat-card-content>
                  <div class="mail-info">
                    <mat-chip-set>
                      <mat-chip>ID: {{ curMail()!.id }}</mat-chip>
                      <mat-chip>{{ formatDate(curMail()!.created_at) }}</mat-chip>
                      <mat-chip>FROM: {{ curMail()!.address }}</mat-chip>
                      <mat-chip>TO: {{ curMail()!.to_mail }}</mat-chip>
                    </mat-chip-set>
                    <div class="mail-buttons">
                      <button mat-button color="primary" (click)="showCode.set(!showCode())">{{ 'toggleMetadata' | translate }}</button>
                      @if (enableUserDeleteEmail) {
                        <button mat-button color="warn" (click)="openDeleteDialog()">{{ 'delete' | translate }}</button>
                      }
                    </div>
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
              <div class="empty-content"><mat-icon>email</mat-icon><p>{{ 'selectMail' | translate }}</p></div>
            }
          </div>
        </div>
      } @else {
        <!-- Mobile Toolbar -->
        <div class="mobile-toolbar">
          <button mat-stroked-button color="primary" (click)="refresh()">{{ 'refresh' | translate }}</button>
        </div>
        <mat-form-field appearance="outline" class="mobile-filter-field" subscriptSizing="dynamic">
          <mat-label>{{ 'filter' | translate }}</mat-label>
          <input matInput [(ngModel)]="filterKeyword">
        </mat-form-field>

        <!-- Mobile View -->
        @if (filteredData().length === 0) {
          <div class="empty-state"><mat-icon>inbox</mat-icon><p>{{ 'noMails' | translate }}</p></div>
        } @else {
          <mat-nav-list class="mobile-mail-list">
            @for (row of filteredData(); track row.id) {
              <mat-list-item (click)="clickRowMobile(row)">
                <div matListItemTitle class="mail-subject">{{ row.subject }}</div>
                <div matListItemLine class="mobile-mail-meta">ID: {{ row.id }} · {{ formatDate(row.created_at) }}</div>
                <div matListItemLine class="mobile-mail-from">TO: {{ row.to_mail }}</div>
              </mat-list-item>
            }
          </mat-nav-list>
        }
        <mat-paginator [length]="count()" [pageSize]="pageSize()" [pageSizeOptions]="[10, 20, 50]"
          [pageIndex]="page() - 1" (page)="onPageChange($event)" showFirstLastButtons></mat-paginator>
      }
    </div>
  `,
  styles: [`
    .sendbox-container { height: 100%; }
    .toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-field { flex: 1; min-width: 200px; }
    .mail-layout { display: flex; gap: 16px; height: calc(100% - 80px); }
    .mail-list { width: 320px; min-width: 320px; border-right: 1px solid var(--mat-sys-outline-variant, #ccc); display: flex; flex-direction: column; }
    mat-nav-list { flex: 1; overflow-y: auto; max-height: 60vh; }
    .mail-content { flex: 1; overflow-y: auto; max-height: 70vh; }
    .mail-subject { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mail-meta { font-size: 12px; color: var(--mat-sys-on-surface-variant, #666); }
    .mail-from { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mail-id { margin-right: 8px; }
    .selected { background-color: var(--mat-sys-primary-container, #e3f2fd) !important; }
    .empty-state, .empty-content { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: var(--mat-sys-on-surface-variant, #666); }
    .empty-state mat-icon, .empty-content mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; }
    .mail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--mat-sys-outline-variant, #ccc); }
    .mail-header h2 { margin: 0; font-size: 18px; }
    .mail-actions { display: flex; gap: 8px; }
    .mail-info { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px; }
    .mail-buttons { display: flex; gap: 8px; margin-left: auto; }
    .code-view, .text-view { white-space: pre-wrap; word-wrap: break-word; background: #f5f5f5; padding: 16px; border-radius: 4px; }
    .html-view { padding: 16px; }
    :host-context(.dark-theme) .code-view, :host-context(.dark-theme) .text-view { background: #333; }
    /* Mobile styles */
    .mobile-toolbar { display: flex; align-items: center; gap: 16px; margin-bottom: 8px; }
    .mobile-filter-field { width: 100%; margin-bottom: 16px; }
    .mobile-mail-list { max-height: 60vh; overflow-y: auto; }
    .mobile-mail-meta { font-size: 12px; color: var(--mat-sys-on-surface-variant, #666); }
    .mobile-mail-from { font-size: 12px; color: var(--mat-sys-on-surface-variant, #888); }
  `]
})
export class SendboxComponent implements OnInit {
  @Input() enableUserDeleteEmail = false;
  @Input() showEMailFrom = false;
  @Input() fetchMailData!: (limit: number, offset: number) => Promise<{ results: any[]; count: number }>;
  @Input() deleteMailFn?: (id: number) => Promise<void>;

  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  isMobile = signal(window.innerWidth < 768);
  data = signal<SendMailItem[]>([]);
  count = signal(0);
  page = signal(1);
  pageSize = signal(20);
  curMail = signal<SendMailItem | null>(null);
  showCode = signal(false);
  multiActionMode = signal(false);
  filterKeyword = '';

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  showMultiActionMode = computed(() => this.enableUserDeleteEmail);

  filteredData = computed(() => {
    const items = this.data();
    if (!this.filterKeyword.trim()) return items;
    const keyword = this.filterKeyword.toLowerCase();
    return items.filter(item =>
      (item.subject || '').toLowerCase().includes(keyword) ||
      (item.to_mail || '').toLowerCase().includes(keyword) ||
      (item.content || '').toLowerCase().includes(keyword)
    );
  });

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
      if (!this.isMobile() && !this.curMail() && parsedResults.length > 0) this.curMail.set(parsedResults[0]);
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

  clickRowMobile(row: SendMailItem) {
    this.curMail.set(row);
    this.dialog.open(SendboxMobileDialogComponent, {
      data: { mail: row, enableUserDeleteEmail: this.enableUserDeleteEmail, deleteMailFn: this.deleteMailFn, onDelete: () => this.refresh() },
      width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh', panelClass: 'fullscreen-dialog'
    });
  }

  selectAll(checked: boolean) { this.data.update(items => items.map(item => ({ ...item, checked }))); }

  openDeleteDialog() {
    const dialogRef = this.dialog.open(SendboxConfirmDialogComponent, { width: '320px', data: { message: '确定要删除邮件吗?' } });
    dialogRef.afterClosed().subscribe(result => { if (result) this.deleteMail(); });
  }

  openMultiDeleteDialog() {
    const selectedMails = this.data().filter(item => item.checked);
    if (selectedMails.length === 0) { this.snackbar.error('请选择邮件'); return; }
    const dialogRef = this.dialog.open(SendboxMultiDeleteDialogComponent, {
      width: '400px', data: { selectedMails, deleteMailFn: this.deleteMailFn }
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
      try { await this.data.deleteMailFn(selectedMails[i].id); } catch (error) { console.error(error); }
      this.current = i + 1;
      this.progress = Math.floor((i + 1) / selectedMails.length * 100);
    }
    this.snackbar.success('成功');
    this.dialogRef.close(true);
  }
}

// Mobile Mail Dialog
@Component({
  selector: 'app-sendbox-mobile-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, TranslateModule],
  template: `
    <div class="fullscreen-mail-dialog">
      <div class="dialog-header">
        <button mat-icon-button (click)="close()"><mat-icon>arrow_back</mat-icon></button>
        <span class="dialog-title">{{ data.mail.subject }}</span>
      </div>
      <div class="dialog-content">
        <mat-chip-set>
          <mat-chip>ID: {{ data.mail.id }}</mat-chip>
          <mat-chip>FROM: {{ data.mail.address }}</mat-chip>
          <mat-chip>TO: {{ data.mail.to_mail }}</mat-chip>
        </mat-chip-set>
        <div class="mail-body">
          @if (!data.mail.is_html) {
            <pre class="text-view">{{ data.mail.content }}</pre>
          } @else {
            <div [innerHTML]="data.mail.content" class="html-view"></div>
          }
        </div>
        @if (data.enableUserDeleteEmail) {
          <button mat-raised-button color="warn" (click)="deleteMail()">{{ 'delete' | translate }}</button>
        }
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-mail-dialog { display: flex; flex-direction: column; height: 100%; background: var(--mat-sys-surface, #fff); }
    :host-context(.dark-theme) .fullscreen-mail-dialog { background: #202124; }
    .dialog-header { display: flex; align-items: center; padding: 8px; border-bottom: 1px solid var(--mat-sys-outline-variant, #ccc); position: sticky; top: 0; background: inherit; z-index: 1; }
    .dialog-title { font-size: 16px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-left: 8px; }
    .dialog-content { flex: 1; overflow-y: auto; padding: 16px; }
    .mail-body { margin-top: 16px; }
    .text-view { white-space: pre-wrap; word-wrap: break-word; background: #f5f5f5; padding: 16px; border-radius: 4px; }
    :host-context(.dark-theme) .text-view { background: #333; }
  `]
})
export class SendboxMobileDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef);
  private snackbar = inject(SnackbarService);

  close() { this.dialogRef.close(); }

  async deleteMail() {
    if (!this.data.deleteMailFn) return;
    try {
      await this.data.deleteMailFn(this.data.mail.id);
      this.snackbar.success('成功');
      this.data.onDelete();
      this.dialogRef.close();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}
