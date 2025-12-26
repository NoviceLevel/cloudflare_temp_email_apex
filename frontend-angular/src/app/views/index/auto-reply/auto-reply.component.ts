import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-auto-reply',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule, TranslateModule
  ],
  template: `
    @if (state.settings().address) {
      <div class="auto-reply-container">
        <div class="header">
          <h3>{{ 'settings' | translate }}</h3>
          <button mat-raised-button color="primary" (click)="saveData()">{{ 'save' | translate }}</button>
        </div>

        <mat-slide-toggle [(ngModel)]="enableAutoReply" class="mb-3">
          {{ 'enableAutoReply' | translate }}
        </mat-slide-toggle>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'name' | translate }}</mat-label>
          <input matInput [(ngModel)]="name" [disabled]="!enableAutoReply">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'sourcePrefixLabel' | translate }}</mat-label>
          <input matInput [(ngModel)]="sourcePrefix" [disabled]="!enableAutoReply">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'subject' | translate }}</mat-label>
          <input matInput [(ngModel)]="subject" [disabled]="!enableAutoReply">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'autoReplyContent' | translate }}</mat-label>
          <textarea matInput [(ngModel)]="autoReplyMessage" rows="4" [disabled]="!enableAutoReply"></textarea>
        </mat-form-field>
      </div>
    }
  `,
  styles: [`
    .auto-reply-container { max-width: 600px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; margin-bottom: 16px; }
    .mb-3 { margin-bottom: 16px; display: block; }
  `]
})
export class AutoReplyComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  sourcePrefix = '';
  enableAutoReply = false;
  autoReplyMessage = '';
  subject = '';
  name = '';

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/api/auto_reply');
      this.sourcePrefix = res.source_prefix || '';
      this.enableAutoReply = res.enabled || false;
      this.name = res.name || '';
      this.autoReplyMessage = res.message || '';
      this.subject = res.subject || '';
    } catch (e: any) {
      this.snackbar.error(e.message || this.translate.instant('loadFailed'));
    }
  }

  async saveData() {
    try {
      await this.api.fetch('/api/auto_reply', {
        method: 'POST',
        body: {
          auto_reply: {
            enabled: this.enableAutoReply,
            source_prefix: this.sourcePrefix,
            name: this.name,
            message: this.autoReplyMessage,
            subject: this.subject,
          }
        }
      });
      this.snackbar.success(this.translate.instant('successTip'));
    } catch (e: any) {
      this.snackbar.error(e.message || this.translate.instant('error'));
    }
  }
}
