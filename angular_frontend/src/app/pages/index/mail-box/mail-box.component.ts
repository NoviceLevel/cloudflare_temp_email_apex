import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { StateService } from '../../../services/state.service';
import { ApiService } from '../../../services/api.service';
import { I18nService } from '../../../services/i18n.service';

interface Email {
  id: number;
  subject: string;
  source: string;
  text?: string;
  message?: string;
  created_at: string;
  checked?: boolean;
}

@Component({
  selector: 'app-mail-box',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatListModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatSlideToggleModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <div class="mail-box">
      <!-- Toolbar -->
      <div class="toolbar">
        @if (multiActionMode()) {
          <button mat-button (click)="cancelMultiAction()">{{ t()('cancelMultiAction') }}</button>
          <button mat-button (click)="selectAll()">{{ t()('selectAll') }}</button>
          <button mat-button (click)="unselectAll()">{{ t()('unselectAll') }}</button>
          <button mat-button color="warn" (click)="deleteSelected()">{{ t()('delete') }}</button>
        } @else {
          <button mat-button (click)="multiActionMode.set(true)">{{ t()('multiAction') }}</button>
        }
        
        <div class="pagination">
          <button mat-icon-button [disabled]="page() <= 1" (click)="prevPage()">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <span>{{ page() }} / {{ totalPages() }}</span>
          <button mat-icon-button [disabled]="page() >= totalPages()" (click)="nextPage()">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
        
        <mat-slide-toggle [checked]="state.autoRefresh()" (change)="state.setAutoRefresh($event.checked)">
          {{ state.autoRefresh() ? t()('refreshAfter', {msg: countdown().toString()}) : t()('autoRefresh') }}
        </mat-slide-toggle>
        
        <button mat-button (click)="loadMails()">
          <mat-icon>refresh</mat-icon>
          {{ t()('refresh') }}
        </button>
      </div>
      
      <mat-divider></mat-divider>
      
      <!-- Content -->
      <div class="content">
        <!-- Mail List -->
        <div class="mail-list">
          @if (loading()) {
            <div class="loading"><mat-spinner></mat-spinner></div>
          } @else if (mails().length === 0) {
            <div class="no-data">{{ t()('noData') }}</div>
          } @else {
            <mat-selection-list [multiple]="false">
              @for (mail of mails(); track mail.id) {
                <mat-list-option 
                  [selected]="selectedMail()?.id === mail.id"
                  (click)="selectMail(mail)">
                  @if (multiActionMode()) {
                    <mat-checkbox [checked]="mail.checked" (change)="mail.checked = $event.checked" (click)="$event.stopPropagation()"></mat-checkbox>
                  }
                  <div class="mail-item">
                    <div class="mail-subject">{{ mail.subject || t()('noSubject') }}</div>
                    <div class="mail-meta">
                      <span>ID: {{ mail.id }}</span>
                      <span>{{ formatDate(mail.created_at) }}</span>
                    </div>
                    <div class="mail-from">{{ mail.source }}</div>
                  </div>
                </mat-list-option>
              }
            </mat-selection-list>
          }
        </div>
        
        <!-- Mail Preview -->
        <div class="mail-preview">
          @if (selectedMail()) {
            <div class="preview-header">
              <button mat-button [disabled]="!canGoPrev()" (click)="prevMail()">
                <mat-icon>chevron_left</mat-icon>{{ t()('prevMail') }}
              </button>
              <button mat-button [disabled]="!canGoNext()" (click)="nextMail()">
                {{ t()('nextMail') }}<mat-icon>chevron_right</mat-icon>
              </button>
            </div>
            <h2>{{ selectedMail()!.subject || t()('noSubject') }}</h2>
            <div class="preview-meta">
              <span><strong>{{ t()('from') }}:</strong> {{ selectedMail()!.source }}</span>
              <span><strong>{{ t()('date') }}:</strong> {{ formatDate(selectedMail()!.created_at) }}</span>
            </div>
            <mat-divider></mat-divider>
            <div class="preview-content" [innerHTML]="selectedMail()!.message || selectedMail()!.text || ''"></div>
          } @else {
            <div class="no-selection">{{ t()('pleaseSelectMail') }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mail-box { height: 100%; display: flex; flex-direction: column; }
    .toolbar { display: flex; align-items: center; gap: 8px; padding: 8px; flex-wrap: wrap; }
    .pagination { display: flex; align-items: center; gap: 4px; }
    .content { display: flex; flex: 1; min-height: 400px; }
    .mail-list { width: 300px; border-right: 1px solid var(--mat-sys-outline-variant); overflow-y: auto; }
    .mail-preview { flex: 1; padding: 16px; overflow-y: auto; }
    .mail-item { padding: 8px 0; }
    .mail-subject { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .mail-meta { font-size: 12px; color: var(--mat-sys-on-surface-variant); display: flex; gap: 8px; }
    .mail-from { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .loading, .no-data, .no-selection { display: flex; justify-content: center; align-items: center; height: 200px; color: var(--mat-sys-on-surface-variant); }
    .preview-header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .preview-meta { display: flex; flex-direction: column; gap: 4px; margin: 8px 0; font-size: 14px; }
    .preview-content { margin-top: 16px; }
    @media (max-width: 768px) {
      .content { flex-direction: column; }
      .mail-list { width: 100%; border-right: none; border-bottom: 1px solid var(--mat-sys-outline-variant); max-height: 300px; }
    }
  `]
})
export class MailBoxComponent implements OnInit, OnDestroy {
  state = inject(StateService);
  private api = inject(ApiService);
  private i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);
  
  t = this.i18n.t;
  loading = signal(false);
  mails = signal<Email[]>([]);
  selectedMail = signal<Email | null>(null);
  page = signal(1);
  count = signal(0);
  pageSize = 20;
  multiActionMode = signal(false);
  countdown = signal(60);
  private timer: any;

  totalPages = () => Math.max(1, Math.ceil(this.count() / this.pageSize));
  canGoPrev = () => this.mails().findIndex(m => m.id === this.selectedMail()?.id) > 0 || this.page() > 1;
  canGoNext = () => {
    const idx = this.mails().findIndex(m => m.id === this.selectedMail()?.id);
    return idx < this.mails().length - 1 || this.page() < this.totalPages();
  };

  ngOnInit() {
    this.loadMails();
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  startTimer() {
    this.countdown.set(this.state.autoRefreshInterval());
    this.timer = setInterval(() => {
      if (!this.state.autoRefresh()) return;
      this.countdown.update(v => v - 1);
      if (this.countdown() <= 0) {
        this.countdown.set(this.state.autoRefreshInterval());
        this.loadMails();
      }
    }, 1000);
  }

  async loadMails() {
    if (!this.state.jwt()) return;
    this.loading.set(true);
    try {
      const res = await this.api.getMails(this.pageSize, (this.page() - 1) * this.pageSize).toPromise();
      this.mails.set(res?.results || []);
      if (res?.count) this.count.set(res.count);
    } catch (e: any) {
      this.snackBar.open(e.message, 'OK', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  selectMail(mail: Email) {
    if (this.multiActionMode()) {
      mail.checked = !mail.checked;
    } else {
      this.selectedMail.set(mail);
    }
  }

  prevPage() { this.page.update(v => v - 1); this.loadMails(); }
  nextPage() { this.page.update(v => v + 1); this.loadMails(); }

  prevMail() {
    const idx = this.mails().findIndex(m => m.id === this.selectedMail()?.id);
    if (idx > 0) this.selectedMail.set(this.mails()[idx - 1]);
    else if (this.page() > 1) { this.prevPage(); }
  }

  nextMail() {
    const idx = this.mails().findIndex(m => m.id === this.selectedMail()?.id);
    if (idx < this.mails().length - 1) this.selectedMail.set(this.mails()[idx + 1]);
    else if (this.page() < this.totalPages()) { this.nextPage(); }
  }

  cancelMultiAction() {
    this.multiActionMode.set(false);
    this.mails().forEach(m => m.checked = false);
  }

  selectAll() { this.mails().forEach(m => m.checked = true); }
  unselectAll() { this.mails().forEach(m => m.checked = false); }

  async deleteSelected() {
    const selected = this.mails().filter(m => m.checked);
    if (selected.length === 0) return;
    if (!confirm(`Delete ${selected.length} mails?`)) return;
    for (const mail of selected) {
      try { await this.api.deleteMail(mail.id).toPromise(); } catch {}
    }
    this.snackBar.open(this.t()('success'), 'OK', { duration: 2000 });
    this.loadMails();
    this.cancelMultiAction();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }
}
