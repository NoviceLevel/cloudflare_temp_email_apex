import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { MailboxComponent } from '../../../components/mailbox/mailbox.component';

@Component({
  selector: 'app-admin-mails',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MailboxComponent,
  ],
  template: `
    <div class="admin-mails">
      <div class="filter-row">
        <mat-form-field appearance="outline" class="address-input">
          <mat-label>留空查询所有地址</mat-label>
          <input matInput [(ngModel)]="addressFilter" (keydown.enter)="queryMail()">
        </mat-form-field>
        <button mat-stroked-button color="primary" (click)="queryMail()">查询</button>
      </div>

      <app-mailbox
        [enableUserDeleteEmail]="true"
        [fetchMailData]="fetchMailData"
        [showFilterInput]="true">
      </app-mailbox>
    </div>
  `,
  styles: [`
    .admin-mails {
      padding: 16px 0;
    }
    .filter-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .address-input {
      max-width: 400px;
      flex: 1;
    }
  `]
})
export class AdminMailsComponent {
  state = inject(GlobalStateService);
  private api = inject(ApiService);

  addressFilter = '';

  constructor() {
    // 从 state 获取初始地址
    this.addressFilter = this.state.adminMailTabAddress();
  }

  queryMail() {
    this.addressFilter = this.addressFilter?.trim() || '';
    this.state.adminMailTabAddress.set(this.addressFilter);
  }

  fetchMailData = async (limit: number, offset: number) => {
    return await this.api.adminGetMails(limit, offset, this.addressFilter || undefined);
  };
}
