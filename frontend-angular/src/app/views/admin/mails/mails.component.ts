import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { MailboxComponent } from '../../../components/mailbox/mailbox.component';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

@Component({
  selector: 'app-admin-mails',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, TranslateModule, MailboxComponent,
  ],
  template: `
    <div class="mails-page">
      <!-- 搜索栏 -->
      <div class="admin-card mb-4">
        <div class="table-toolbar">
          <div class="table-search">
            <mat-icon>search</mat-icon>
            <input type="text" [(ngModel)]="addressFilter" (keydown.enter)="queryMail()" placeholder="按邮箱地址筛选..." class="search-input">
            <button mat-icon-button (click)="queryMail()"><mat-icon>arrow_forward</mat-icon></button>
          </div>
          @if (addressFilter) {
            <button mat-stroked-button (click)="clearFilter()">
              <mat-icon>clear</mat-icon>清除筛选
            </button>
          }
        </div>
      </div>

      <!-- 邮件列表 -->
      <div class="admin-card">
        <app-mailbox
          [enableUserDeleteEmail]="true"
          [fetchMailData]="fetchMailData"
          [showFilterInput]="true">
        </app-mailbox>
      </div>
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .mails-page { }
    .mb-4 { margin-bottom: 24px; }
    .search-input { flex: 1; border: none; outline: none; font-size: 14px; background: transparent; padding: 8px; }
    :host-context(.dark) .search-input { color: #e8eaed; }
  `]
})
export class AdminMailsComponent {
  state = inject(GlobalStateService);
  private api = inject(ApiService);

  addressFilter = '';

  constructor() {
    this.addressFilter = this.state.adminMailTabAddress();
  }

  queryMail() {
    this.addressFilter = this.addressFilter?.trim() || '';
    this.state.adminMailTabAddress.set(this.addressFilter);
  }

  clearFilter() {
    this.addressFilter = '';
    this.state.adminMailTabAddress.set('');
  }

  fetchMailData = async (limit: number, offset: number) => {
    return await this.api.adminGetMails(limit, offset, this.addressFilter || undefined);
  };
}
