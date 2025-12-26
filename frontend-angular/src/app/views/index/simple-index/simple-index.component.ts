import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { LoginComponent } from '../../common/login/login.component';
import { AccountSettingsComponent } from '../account-settings/account-settings.component';
import { MailContentRendererComponent } from '../../../components/mail-content-renderer/mail-content-renderer.component';
import { processItem } from '../../../utils/email-parser';

@Component({
  selector: 'app-simple-index',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslateModule,
    LoginComponent,
    AccountSettingsComponent,
    MailContentRendererComponent,
  ],
  template: `
    <div class="simple-index-container">
      @if (!state.settings().address) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-login></app-login>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card appearance="outlined" class="mb-4">
          <mat-card-content class="text-center">
            <div class="address-display mb-4">{{ state.settings().address }}</div>
            <div class="actions-row">
              <button mat-stroked-button color="primary" (click)="refreshMails()" [disabled]="state.loading()">
                <mat-icon>refresh</mat-icon>
                {{ 'refreshMails' | translate }}
              </button>
              <button mat-stroked-button (click)="copyAddress()">
                <mat-icon>content_copy</mat-icon>
                {{ 'copyAddress' | translate }}
              </button>
              <button mat-stroked-button (click)="exitSimpleIndex()">
                <mat-icon>exit_to_app</mat-icon>
                {{ 'exitSimpleIndex' | translate }}
              </button>
              <button mat-stroked-button (click)="showAccountSettingsCard.set(true)">
                <mat-icon>settings</mat-icon>
                {{ 'accountSettings' | translate }}
              </button>
            </div>
            @if (isFirstPage()) {
              <div class="refresh-timer mt-3">
                {{ 'refreshAfter' | translate:{ msg: Math.max(0, currentAutoRefreshInterval()) } }}
              </div>
            }
          </mat-card-content>
        </mat-card>

        @if (showAccountSettingsCard()) {
          <mat-card appearance="outlined" class="mb-4">
            <mat-card-header>
              <mat-card-title>{{ 'accountSettings' | translate }}</mat-card-title>
              <span class="spacer"></span>
              <button mat-icon-button (click)="showAccountSettingsCard.set(false)">
                <mat-icon>close</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <app-account-settings></app-account-settings>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card appearance="outlined" class="text-left">
            <mat-card-content>
              @if (totalCount() > 1) {
                <div class="pagination-row mb-4">
                  <button mat-button [disabled]="!canGoPrev()" (click)="prevPage()">
                    <mat-icon>chevron_left</mat-icon>
                    {{ 'prevPage' | translate }}
                  </button>
                  <span class="page-info">
                    {{ 'mailCount' | translate:{ current: currentPage(), total: totalCount() } }}
                  </span>
                  <button mat-button [disabled]="!canGoNext()" (click)="nextPage()">
                    {{ 'nextPage' | translate }}
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </div>
              }

              @if (!currentMail()) {
                <div class="empty-state">
                  <mat-icon class="empty-icon">email</mat-icon>
                  <h3>{{ 'noMails' | translate }}</h3>
                </div>
              } @else {
                @if (currentMail()?.subject) {
                  <h3 class="mb-4">{{ currentMail()?.subject }}</h3>
                }
                <app-mail-content-renderer
                  [mail]="currentMail()!"
                  [showReply]="false"
                  [showEMailTo]="false"
                  [enableUserDeleteEmail]="state.openSettings().enableUserDeleteEmail"
                  (onDelete)="deleteMail()">
                </app-mail-content-renderer>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .simple-index-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .mb-4 {
      margin-bottom: 16px;
    }
    .mt-3 {
      margin-top: 12px;
    }
    .text-center {
      text-align: center;
    }
    .text-left {
      text-align: left;
    }
    .address-display {
      font-size: 1.25rem;
      font-weight: bold;
    }
    .actions-row {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .refresh-timer {
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
    }
    :host-context(.dark-theme) .refresh-timer {
      color: rgba(255, 255, 255, 0.6);
    }
    .pagination-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-info {
      font-size: 0.875rem;
    }
    .empty-state {
      text-align: center;
      padding: 48px;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #9e9e9e;
    }
    mat-card-header {
      display: flex;
      align-items: center;
    }
    .spacer {
      flex: 1;
    }
  `]
})
export class SimpleIndexComponent implements OnInit, OnDestroy {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  Math = Math;

  currentPage = signal(1);
  totalCount = signal(0);
  currentMail = signal<any>(null);
  showAccountSettingsCard = signal(false);
  currentAutoRefreshInterval = signal(60);
  private timer: any = null;

  isFirstPage = computed(() => this.currentPage() === 1);
  canGoPrev = computed(() => this.currentPage() > 1);
  canGoNext = computed(() => this.currentPage() < this.totalCount());

  async ngOnInit() {
    await this.api.getSettings();
    await this.fetchMails();

    this.timer = setInterval(async () => {
      if (!this.isFirstPage()) {
        this.currentAutoRefreshInterval.set(60);
        return;
      }

      const newVal = this.currentAutoRefreshInterval() - 1;
      this.currentAutoRefreshInterval.set(newVal);
      if (newVal <= 0) {
        await this.refreshMails();
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async fetchMails() {
    if (!this.state.settings().address) return;
    try {
      const { results, count } = await this.api.fetch<{ results: any[]; count: number }>(
        `/api/mails?limit=1&offset=${this.currentPage() - 1}`
      );
      if (count > 0) {
        this.totalCount.set(count);
      }
      const rawMail = results && results.length > 0 ? results[0] : null;
      this.currentMail.set(rawMail ? await processItem(rawMail) : null);
    } catch (error: any) {
      console.error('Failed to fetch mails:', error);
      this.snackbar.error(this.translate.instant('fetchMailsFailed'));
    }
  }

  async deleteMail() {
    const mail = this.currentMail();
    if (!mail) return;
    try {
      await this.api.fetch(`/api/mails/${mail.id}`, { method: 'DELETE' });
      this.snackbar.success(this.translate.instant('deleteSuccess'));
      this.currentMail.set(null);
      await this.refreshMails();
    } catch (error: any) {
      console.error('Failed to delete mail:', error);
      this.snackbar.error(this.translate.instant('deleteMailFailed'));
    }
  }

  async refreshMails() {
    if (this.state.loading()) return;
    this.currentPage.set(1);
    this.showAccountSettingsCard.set(false);
    this.currentAutoRefreshInterval.set(60);
    await this.fetchMails();
    this.snackbar.success(this.translate.instant('refreshSuccess'));
  }

  async copyAddress() {
    try {
      await navigator.clipboard.writeText(this.state.settings().address);
      this.snackbar.success(this.translate.instant('addressCopied'));
    } catch (error) {
      this.snackbar.error(this.translate.instant('copyFailed'));
    }
  }

  exitSimpleIndex() {
    this.state.useSimpleIndex.set(false);
    localStorage.setItem('useSimpleIndex', 'false');
  }

  prevPage() {
    if (this.canGoPrev()) {
      this.currentPage.update(p => p - 1);
      this.fetchMails();
    }
  }

  nextPage() {
    if (this.canGoNext()) {
      this.currentPage.update(p => p + 1);
      this.fetchMails();
    }
  }
}
