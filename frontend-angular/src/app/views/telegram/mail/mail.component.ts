import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { processItem } from '../../../utils/email-parser';
import { utcToLocalDate } from '../../../utils';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-telegram-mail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="center">
      @if (curMail()?.message) {
        <mat-card appearance="outlined" class="mail-card">
          <mat-card-content>
            <div class="chips-row mb-4">
              <mat-chip color="primary" highlighted>ID: {{ curMail()?.id }}</mat-chip>
              <mat-chip color="primary" highlighted>Date: {{ formatDate(curMail()?.created_at) }}</mat-chip>
              <mat-chip color="primary" highlighted>FROM: {{ curMail()?.source }}</mat-chip>
              @if (showEMailTo) {
                <mat-chip color="primary" highlighted>TO: {{ curMail()?.address }}</mat-chip>
              }
            </div>
            <iframe [srcdoc]="curMail()?.message" class="mail-iframe"></iframe>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-spinner diameter="40"></mat-spinner>
      }
    </div>
  `,
  styles: [`
    .center {
      display: flex;
      text-align: left;
      place-items: center;
      justify-content: center;
      height: 80vh;
    }
    .mail-card {
      max-width: 800px;
      height: 100%;
    }
    .chips-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .mb-4 {
      margin-bottom: 16px;
    }
    .mail-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `]
})
export class TelegramMailComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  curMail = signal<any>({});
  showEMailTo = false;

  async ngOnInit() {
    this.curMail.set(await this.fetchMailData());
  }

  async fetchMailData() {
    try {
      const mailId = this.route.snapshot.queryParamMap.get('mail_id');
      const initData = this.state.telegramApp()?.initData;

      if (!initData || !mailId) {
        return {};
      }

      this.state.loading.set(true);
      const res = await this.api.fetch<any>('/telegram/get_mail', {
        method: 'POST',
        body: JSON.stringify({
          initData: initData,
          mailId: mailId
        })
      });
      return await processItem(res);
    } catch (error) {
      console.error(error);
      return {};
    } finally {
      this.state.loading.set(false);
    }
  }

  formatDate(date: string): string {
    return utcToLocalDate(date, this.state.useUTCDate());
  }
}
