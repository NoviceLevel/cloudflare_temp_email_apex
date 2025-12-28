import { Component, inject, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { SnackbarService } from '../../services/snackbar.service';
import { processItem, ParsedMail } from '../../utils/email-parser';
import { MailViewComponent } from '../mail-view/mail-view.component';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCheckboxModule,
    MatMenuModule, MatTooltipModule, MatProgressSpinnerModule, TranslateModule, MailViewComponent,
  ],
  template: `
    <div class="inbox-wrapper">
      @if (selectedMail()) {
        <app-mail-view [mail]="selectedMail()!" (onBack)="closeMail()" (onDelete)="deleteMail($event)"></app-mail-view>
      } @else {
        <!-- Toolbar - Desktop only -->
        <div class="inbox-toolbar desktop-toolbar">
          <div class="toolbar-left">
            <mat-checkbox [checked]="allSelected()" [indeterminate]="someSelected()" (change)="toggleSelectAll($event.checked)" class="select-all"></mat-checkbox>
            <button class="toolbar-btn" (click)="refresh()" matTooltip="Refresh">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            </button>
            <button class="toolbar-btn" [matMenuTriggerFor]="moreMenu" matTooltip="More">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
            <mat-menu #moreMenu="matMenu">
              <button mat-menu-item (click)="deleteSelected()" [disabled]="selectedIds().length === 0">
                <mat-icon>delete</mat-icon>删除选中
              </button>
            </mat-menu>
          </div>
          <div class="toolbar-right">
            <span class="page-info">{{ pageStart() }}–{{ pageEnd() }} of {{ totalCount() }}</span>
            <button class="toolbar-btn" (click)="prevPage()" [disabled]="page() === 1">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <button class="toolbar-btn" (click)="nextPage()" [disabled]="!hasNextPage()">
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="inbox-content">
          @if (loading()) {
            <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
          } @else if (filteredMails().length === 0) {
            <div class="empty">
              <svg width="120" height="120" viewBox="0 0 24 24" class="empty-icon"><path fill="#dadce0" d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z"/></svg>
              <div class="empty-title">收件箱为空</div>
              <div class="empty-subtitle">发送到您临时邮箱的邮件将显示在这里</div>
            </div>
          } @else {
            <div class="mail-list">
              @for (mail of filteredMails(); track mail.id) {
                <!-- Desktop row -->
                <div class="mail-row desktop-row" [class.selected]="isSelected(mail.id)" (click)="openMail(mail)">
                  <mat-checkbox [checked]="isSelected(mail.id)" (click)="$event.stopPropagation()" (change)="toggleSelect(mail.id, $event.checked)" class="row-checkbox"></mat-checkbox>
                  <div class="mail-sender">{{ getSenderName(mail.source) }}</div>
                  <div class="mail-preview">
                    <span class="mail-subject">{{ mail.subject || '(无主题)' }}</span>
                    <span class="mail-snippet"> – {{ getSnippet(mail) }}</span>
                  </div>
                  <div class="mail-date">{{ formatDate(mail.created_at) }}</div>
                </div>
                <!-- Mobile row (Gmail style) -->
                <div class="mail-row mobile-row" (click)="openMail(mail)">
                  <div class="mobile-avatar">{{ getSenderInitial(mail.source) }}</div>
                  <div class="mobile-content">
                    <div class="mobile-header">
                      <span class="mobile-sender">{{ getSenderName(mail.source) }}</span>
                      <span class="mobile-date">{{ formatDate(mail.created_at) }}</span>
                    </div>
                    <div class="mobile-subject">{{ mail.subject || '(无主题)' }}</div>
                    <div class="mobile-snippet">{{ getSnippet(mail) }}</div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .inbox-wrapper { height: 100%; display: flex; flex-direction: column; }
    
    .inbox-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #e0e0e0; min-height: 48px; }
    :host-context(.dark) .inbox-toolbar { border-color: #3c4043; }
    .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 4px; }
    .toolbar-btn { width: 40px; height: 40px; border: none; background: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #5f6368; }
    .toolbar-btn:hover:not(:disabled) { background: rgba(0,0,0,0.04); }
    .toolbar-btn:disabled { opacity: 0.38; cursor: default; }
    :host-context(.dark) .toolbar-btn { color: #9aa0a6; }
    :host-context(.dark) .toolbar-btn:hover:not(:disabled) { background: rgba(255,255,255,0.08); }
    .page-info { font-size: 12px; color: #5f6368; margin-right: 8px; }
    :host-context(.dark) .page-info { color: #9aa0a6; }

    .inbox-content { flex: 1; overflow-y: auto; }
    .loading, .empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; }
    .empty-icon { opacity: 0.6; }
    .empty-title { font-size: 22px; color: #202124; margin-top: 16px; }
    :host-context(.dark) .empty-title { color: #e8eaed; }
    .empty-subtitle { font-size: 14px; color: #5f6368; margin-top: 8px; text-align: center; padding: 0 16px; }
    :host-context(.dark) .empty-subtitle { color: #9aa0a6; }

    .mail-list { }
    
    /* Desktop row */
    .desktop-row { display: flex; align-items: center; padding: 0 16px; height: 40px; border-bottom: 1px solid transparent; cursor: pointer; transition: none; }
    .desktop-row:hover { box-shadow: inset 1px 0 0 #dadce0, inset -1px 0 0 #dadce0, 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15); z-index: 1; position: relative; }
    :host-context(.dark) .desktop-row:hover { box-shadow: inset 1px 0 0 #5f6368, inset -1px 0 0 #5f6368, 0 1px 2px 0 rgba(0,0,0,.3), 0 1px 3px 1px rgba(0,0,0,.15); }
    .desktop-row.selected { background: #c2dbff; }
    :host-context(.dark) .desktop-row.selected { background: #174ea6; }
    .row-checkbox { margin-right: 12px; }

    .mail-sender { width: 200px; min-width: 200px; font-size: 14px; font-weight: 500; color: #202124; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    :host-context(.dark) .mail-sender { color: #e8eaed; }
    .mail-preview { flex: 1; display: flex; overflow: hidden; font-size: 14px; }
    .mail-subject { color: #202124; white-space: nowrap; }
    :host-context(.dark) .mail-subject { color: #e8eaed; }
    .mail-snippet { color: #5f6368; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    :host-context(.dark) .mail-snippet { color: #9aa0a6; }
    .mail-date { font-size: 12px; color: #5f6368; white-space: nowrap; margin-left: 16px; }
    :host-context(.dark) .mail-date { color: #9aa0a6; }

    /* Mobile row - hidden by default */
    .mobile-row { display: none; }

    @media (max-width: 768px) {
      .desktop-toolbar { display: none; }
      .desktop-row { display: none; }
      
      .mobile-row { display: flex; align-items: flex-start; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; cursor: pointer; gap: 16px; }
      :host-context(.dark) .mobile-row { border-color: #3c4043; }
      .mobile-row:active { background: rgba(0,0,0,0.04); }
      :host-context(.dark) .mobile-row:active { background: rgba(255,255,255,0.04); }
      
      .mobile-avatar { width: 40px; height: 40px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 500; flex-shrink: 0; }
      
      .mobile-content { flex: 1; min-width: 0; }
      .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
      .mobile-sender { font-size: 14px; font-weight: 500; color: #202124; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      :host-context(.dark) .mobile-sender { color: #e8eaed; }
      .mobile-date { font-size: 12px; color: #5f6368; flex-shrink: 0; margin-left: 8px; }
      :host-context(.dark) .mobile-date { color: #9aa0a6; }
      .mobile-subject { font-size: 14px; color: #202124; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
      :host-context(.dark) .mobile-subject { color: #e8eaed; }
      .mobile-snippet { font-size: 14px; color: #5f6368; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      :host-context(.dark) .mobile-snippet { color: #9aa0a6; }

      .empty { min-height: 300px; padding: 24px; }
      .empty-icon { width: 80px; height: 80px; }
    }
  `]
})
export class InboxComponent implements OnInit, OnDestroy {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  mails = signal<ParsedMail[]>([]);
  selectedMail = signal<ParsedMail | null>(null);
  selectedIds = signal<number[]>([]);
  loading = signal(false);
  page = signal(1);
  pageSize = 50;
  totalCount = signal(0);
  private refreshInterval: any = null;

  filteredMails = computed(() => {
    const query = this.state.searchQuery().toLowerCase();
    if (!query) return this.mails();
    return this.mails().filter(m => 
      (m.subject || '').toLowerCase().includes(query) ||
      (m.source || '').toLowerCase().includes(query) ||
      (m.text || '').toLowerCase().includes(query)
    );
  });

  allSelected = computed(() => {
    const mails = this.filteredMails();
    return mails.length > 0 && this.selectedIds().length === mails.length;
  });

  someSelected = computed(() => {
    const ids = this.selectedIds();
    return ids.length > 0 && ids.length < this.filteredMails().length;
  });

  pageStart = computed(() => Math.min((this.page() - 1) * this.pageSize + 1, this.totalCount()));
  pageEnd = computed(() => Math.min(this.page() * this.pageSize, this.totalCount()));
  hasNextPage = computed(() => this.page() * this.pageSize < this.totalCount());

  constructor() {
    // Watch for manual refresh triggers
    effect(() => {
      const trigger = this.state.refreshTrigger();
      if (trigger > 0) {
        this.refresh();
      }
    }, { allowSignalWrites: true });
  }

  async ngOnInit() {
    await this.refresh();
    this.refreshInterval = setInterval(() => { if (!this.selectedMail()) this.refresh(); }, 60000);
  }

  ngOnDestroy() { if (this.refreshInterval) clearInterval(this.refreshInterval); }

  async refresh() {
    this.loading.set(true);
    try {
      const offset = (this.page() - 1) * this.pageSize;
      const res = await this.api.fetch<{ results: any[]; count: number }>(`/api/mails?limit=${this.pageSize}&offset=${offset}`);
      const processed = await Promise.all(res.results.map(item => processItem(item)));
      this.mails.set(processed);
      this.totalCount.set(res.count);
    } catch (error: any) {
      this.snackbar.error(error.message || '加载失败');
    } finally {
      this.loading.set(false);
    }
  }

  openMail(mail: ParsedMail) { this.selectedMail.set(mail); }
  closeMail() { this.selectedMail.set(null); }

  async deleteMail(id: number) {
    try {
      await this.api.fetch(`/api/mails/${id}`, { method: 'DELETE' });
      this.snackbar.success('已删除');
      this.selectedMail.set(null);
      await this.refresh();
    } catch (error: any) {
      this.snackbar.error(error.message || '删除失败');
    }
  }

  toggleSelect(id: number, checked: boolean) {
    this.selectedIds.update(ids => checked ? [...ids, id] : ids.filter(i => i !== id));
  }

  toggleSelectAll(checked: boolean) {
    this.selectedIds.set(checked ? this.filteredMails().map(m => m.id) : []);
  }

  isSelected(id: number): boolean { return this.selectedIds().includes(id); }

  async deleteSelected() {
    const ids = this.selectedIds();
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => this.api.fetch(`/api/mails/${id}`, { method: 'DELETE' })));
      this.snackbar.success(`已删除 ${ids.length} 封邮件`);
      this.selectedIds.set([]);
      await this.refresh();
    } catch (error: any) {
      this.snackbar.error(error.message || '删除失败');
    }
  }

  prevPage() { if (this.page() > 1) { this.page.update(p => p - 1); this.refresh(); } }
  nextPage() { if (this.hasNextPage()) { this.page.update(p => p + 1); this.refresh(); } }

  getSenderName(source: string): string {
    if (!source) return '未知';
    const match = source.match(/^([^<]+)/);
    return match ? match[1].trim() : source.split('@')[0];
  }

  getSenderInitial(source: string): string {
    const name = this.getSenderName(source);
    return name.charAt(0).toUpperCase();
  }

  getSnippet(mail: ParsedMail): string {
    return (mail.text || '').substring(0, 100).replace(/\s+/g, ' ');
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
