import { Component, Input, inject, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { processItem, ParsedMail } from '../../utils/email-parser';
import { utcToLocalDate } from '../../utils/index';
import { MailContentRendererComponent } from '../mail-content-renderer/mail-content-renderer.component';

@Component({
  selector: 'app-mailbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatChipsModule,
    MatBottomSheetModule,
    MatDividerModule,
    MailContentRendererComponent,
  ],
  template: `
    <div class="mailbox-container">
      <!-- Desktop View -->
      @if (!isMobile()) {
        <!-- Toolbar -->
        <div class="toolbar">
          <button mat-button (click)="refresh()">
            <mat-icon>refresh</mat-icon>
            刷新
          </button>
          <mat-slide-toggle [(ngModel)]="autoRefresh" (change)="setupAutoRefresh()">
            {{ autoRefresh ? '自动刷新 ' + autoRefreshCountdown + 's' : '自动刷新' }}
          </mat-slide-toggle>
          @if (showFilterInput) {
            <mat-form-field appearance="outline" class="filter-field" subscriptSizing="dynamic">
              <mat-label>过滤</mat-label>
              <input matInput [(ngModel)]="filterKeyword" placeholder="搜索邮件...">
            </mat-form-field>
          }
        </div>

        <!-- Mail List and Content -->
        <div class="mail-layout">
          <!-- Mail List -->
          <div class="mail-list">
            @if (state.loading()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
              </div>
            } @else if (filteredData().length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>暂无邮件</p>
              </div>
            } @else {
              <mat-nav-list>
                @for (mail of filteredData(); track mail.id) {
                  <mat-list-item 
                    [class.selected]="curMail()?.id === mail.id"
                    (click)="selectMail(mail)">
                    <div matListItemTitle class="mail-subject">{{ mail.subject }}</div>
                    <div matListItemLine class="mail-meta">
                      <span class="mail-id">ID: {{ mail.id }}</span>
                      <span class="mail-date">{{ formatDate(mail.created_at) }}</span>
                    </div>
                    <div matListItemLine class="mail-from">{{ mail.source }}</div>
                  </mat-list-item>
                }
              </mat-nav-list>
            }
            
            <!-- Pagination -->
            <mat-paginator
              [length]="totalCount()"
              [pageSize]="pageSize"
              [pageIndex]="page() - 1"
              [pageSizeOptions]="[10, 20, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>

          <!-- Mail Content -->
          <div class="mail-content">
            @if (curMail()) {
              <div class="mail-header">
                <h2>{{ curMail()!.subject }}</h2>
                <div class="mail-actions">
                  <button mat-button (click)="prevMail()" [disabled]="!canGoPrev()">
                    <mat-icon>chevron_left</mat-icon>
                    上一封
                  </button>
                  <button mat-button (click)="nextMail()" [disabled]="!canGoNext()">
                    下一封
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </div>
              </div>
              <app-mail-content-renderer
                [mail]="curMail()!"
                [enableUserDeleteEmail]="enableUserDeleteEmail"
                [showReply]="showReply"
                [showEMailTo]="false"
                (onDelete)="deleteMailAction()"
                (onReply)="replyMail()"
                (onForward)="forwardMail()">
              </app-mail-content-renderer>
            } @else {
              <div class="empty-content">
                <mat-icon>email</mat-icon>
                <p>请选择邮件</p>
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- Mobile View -->
        <div class="mobile-toolbar">
          <mat-slide-toggle [(ngModel)]="autoRefresh" (change)="setupAutoRefresh()">
            {{ autoRefresh ? autoRefreshCountdown + 's' : '自动刷新' }}
          </mat-slide-toggle>
          <button mat-button (click)="refresh()">刷新</button>
        </div>
        
        @if (showFilterInput) {
          <mat-form-field appearance="outline" class="mobile-filter-field" subscriptSizing="dynamic">
            <mat-label>过滤</mat-label>
            <input matInput [(ngModel)]="filterKeyword">
          </mat-form-field>
        }

        <mat-nav-list class="mobile-mail-list">
          @for (mail of filteredData(); track mail.id) {
            <mat-list-item (click)="selectMailMobile(mail)">
              <div matListItemTitle class="mail-subject">{{ mail.subject }}</div>
              <div matListItemLine class="mobile-mail-meta">
                ID: {{ mail.id }} · {{ formatDate(mail.created_at) }}
              </div>
              <div matListItemLine class="mobile-mail-from">{{ mail.source }}</div>
            </mat-list-item>
            <mat-divider></mat-divider>
          }
        </mat-nav-list>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize"
          [pageIndex]="page() - 1"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .mailbox-container {
      height: 100%;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .filter-field {
      flex: 1;
      min-width: 200px;
    }
    ::ng-deep .filter-field .mat-mdc-form-field-subscript-wrapper,
    ::ng-deep .mobile-filter-field .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
      height: 0 !important;
    }
    ::ng-deep .mobile-filter-field .mdc-notched-outline__trailing,
    ::ng-deep .mobile-filter-field .mdc-notched-outline__leading,
    ::ng-deep .mobile-filter-field .mdc-notched-outline__notch {
      border-width: 1px !important;
    }
    .mail-layout {
      display: flex;
      gap: 16px;
      height: calc(100% - 80px);
    }
    .mail-list {
      width: 320px;
      min-width: 320px;
      border-right: 1px solid var(--mat-sys-outline-variant, #ccc);
      display: flex;
      flex-direction: column;
    }
    mat-nav-list {
      flex: 1;
      overflow-y: auto;
      max-height: 60vh;
    }
    .mail-content {
      flex: 1;
      overflow-y: auto;
      max-height: 70vh;
    }
    .mail-subject {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mail-meta {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .mail-from {
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mail-id {
      margin-right: 8px;
    }
    .selected {
      background-color: var(--mat-sys-primary-container, #e3f2fd) !important;
    }
    .loading-container, .empty-state, .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .empty-state mat-icon, .empty-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    .mail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--mat-sys-outline-variant, #ccc);
    }
    .mail-header h2 {
      margin: 0;
      font-size: 18px;
    }
    .mail-actions {
      display: flex;
      gap: 8px;
    }

    /* Mobile styles */
    .mobile-toolbar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .mobile-filter-field {
      width: 100%;
      margin-bottom: 16px;
    }
    .mobile-mail-list {
      max-height: 60vh;
      overflow-y: auto;
    }
    .mobile-mail-meta {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
    .mobile-mail-from {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #888);
    }
  `]
})
export class MailboxComponent implements OnInit, OnDestroy {
  @Input() enableUserDeleteEmail = false;
  @Input() showReply = false;
  @Input() showFilterInput = false;
  @Input() key = '';
  @Input() fetchMailData?: (limit: number, offset: number) => Promise<{ results: any[]; count: number }>;
  @Input() deleteMail?: (id: number) => Promise<void>;
  @Input() deleteMailFn?: (id: number) => Promise<void>;

  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  rawData = signal<ParsedMail[]>([]);
  curMail = signal<ParsedMail | null>(null);
  page = signal(1);
  pageSize = 20;
  totalCount = signal(0);
  filterKeyword = '';
  autoRefresh = false;
  autoRefreshCountdown = 60;
  isMobile = signal(window.innerWidth < 768);
  private refreshTimer: any = null;

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 768);
  }

  filteredData = computed(() => {
    const data = this.rawData();
    if (!this.filterKeyword.trim()) return data;
    const keyword = this.filterKeyword.toLowerCase();
    return data.filter(mail => 
      (mail.subject || '').toLowerCase().includes(keyword) ||
      (mail.text || '').toLowerCase().includes(keyword) ||
      (mail.source || '').toLowerCase().includes(keyword)
    );
  });

  canGoPrev = computed(() => {
    if (!this.curMail()) return false;
    const idx = this.filteredData().findIndex(m => m.id === this.curMail()!.id);
    return idx > 0 || this.page() > 1;
  });

  canGoNext = computed(() => {
    if (!this.curMail()) return false;
    const idx = this.filteredData().findIndex(m => m.id === this.curMail()!.id);
    return idx < this.filteredData().length - 1 || this.totalCount() > this.page() * this.pageSize;
  });

  async ngOnInit() {
    await this.refresh();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  async refresh() {
    try {
      const offset = (this.page() - 1) * this.pageSize;
      let res: { results: any[]; count: number };
      
      if (this.fetchMailData) {
        res = await this.fetchMailData(this.pageSize, offset);
      } else {
        res = await this.api.fetch<{ results: any[]; count: number }>(
          `/api/mails?limit=${this.pageSize}&offset=${offset}`
        );
      }
      
      const processed = await Promise.all(
        res.results.map(item => processItem(item))
      );
      this.rawData.set(processed);
      this.totalCount.set(res.count);
      
      if (processed.length > 0 && !this.curMail() && !this.isMobile()) {
        this.curMail.set(processed[0]);
      }
    } catch (error: any) {
      this.snackbar.error(error.message || '加载失败');
    }
  }

  selectMail(mail: ParsedMail) {
    this.curMail.set(mail);
  }

  selectMailMobile(mail: ParsedMail) {
    this.curMail.set(mail);
    this.dialog.open(MobileMailDialogComponent, {
      data: {
        mail,
        enableUserDeleteEmail: this.enableUserDeleteEmail,
        showReply: this.showReply,
        onDelete: () => this.deleteMailAction(),
        onReply: () => this.replyMail(),
        onForward: () => this.forwardMail(),
      },
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'fullscreen-dialog'
    });
  }

  formatDate(date: string): string {
    return utcToLocalDate(date, false);
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.pageSize = event.pageSize;
    this.refresh();
  }

  async prevMail() {
    const data = this.filteredData();
    const idx = data.findIndex(m => m.id === this.curMail()!.id);
    if (idx > 0) {
      this.curMail.set(data[idx - 1]);
    } else if (this.page() > 1) {
      this.page.update(p => p - 1);
      await this.refresh();
      const newData = this.filteredData();
      if (newData.length > 0) {
        this.curMail.set(newData[newData.length - 1]);
      }
    }
  }

  async nextMail() {
    const data = this.filteredData();
    const idx = data.findIndex(m => m.id === this.curMail()!.id);
    if (idx < data.length - 1) {
      this.curMail.set(data[idx + 1]);
    } else if (this.totalCount() > this.page() * this.pageSize) {
      this.page.update(p => p + 1);
      await this.refresh();
      const newData = this.filteredData();
      if (newData.length > 0) {
        this.curMail.set(newData[0]);
      }
    }
  }

  async deleteMailAction() {
    if (!this.curMail()) return;
    try {
      const deleteFunc = this.deleteMail || this.deleteMailFn;
      if (deleteFunc) {
        await deleteFunc(this.curMail()!.id);
      } else {
        await this.api.fetch(`/api/mails/${this.curMail()!.id}`, { method: 'DELETE' });
      }
      this.snackbar.success('删除成功');
      this.curMail.set(null);
      await this.refresh();
    } catch (error: any) {
      this.snackbar.error(error.message || '删除失败');
    }
  }

  replyMail() {
    this.snackbar.info('回复功能待实现');
  }

  forwardMail() {
    this.snackbar.info('转发功能待实现');
  }

  setupAutoRefresh() {
    this.clearTimer();
    if (this.autoRefresh) {
      this.autoRefreshCountdown = 60;
      this.refreshTimer = setInterval(() => {
        this.autoRefreshCountdown--;
        if (this.autoRefreshCountdown <= 0) {
          this.autoRefreshCountdown = 60;
          this.page.set(1);
          this.refresh();
        }
      }, 1000);
    }
  }

  private clearTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Mobile Mail Fullscreen Dialog Component
@Component({
  selector: 'app-mobile-mail-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MailContentRendererComponent],
  template: `
    <div class="fullscreen-mail-dialog">
      <div class="dialog-header">
        <button mat-icon-button (click)="close()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span class="dialog-title">{{ data.mail.subject }}</span>
      </div>
      <div class="dialog-content">
        <app-mail-content-renderer
          [mail]="data.mail"
          [enableUserDeleteEmail]="data.enableUserDeleteEmail"
          [showReply]="data.showReply"
          [showEMailTo]="false"
          (onDelete)="onDelete()"
          (onReply)="data.onReply()"
          (onForward)="data.onForward()">
        </app-mail-content-renderer>
      </div>
    </div>
  `,
  styles: [`
    .fullscreen-mail-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--mat-sys-surface, #fff);
    }
    :host-context(.dark-theme) .fullscreen-mail-dialog {
      background: #202124;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      padding: 8px;
      border-bottom: 1px solid var(--mat-sys-outline-variant, #ccc);
      position: sticky;
      top: 0;
      background: inherit;
      z-index: 1;
    }
    :host-context(.dark-theme) .dialog-header {
      border-bottom-color: #3c4043;
    }
    .dialog-title {
      font-size: 16px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      margin-left: 8px;
    }
    .dialog-content {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
  `]
})
export class MobileMailDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef);

  close() {
    this.dialogRef.close();
  }

  onDelete() {
    this.data.onDelete();
    this.dialogRef.close();
  }
}
