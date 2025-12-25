import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { MailboxComponent } from '../../../components/mailbox/mailbox.component';

@Component({
  selector: 'app-user-mailbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MailboxComponent,
  ],
  template: `
    <div class="user-mailbox">
      <div class="filter-row">
        <mat-form-field appearance="outline" class="address-select">
          <mat-label>留空查询所有地址</mat-label>
          <mat-select [(ngModel)]="addressFilter" (selectionChange)="queryMail()">
            <mat-option [value]="''">全部地址</mat-option>
            @for (option of addressFilterOptions(); track option.value) {
              <mat-option [value]="option.value">{{ option.title }}</mat-option>
            }
          </mat-select>
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
    .user-mailbox {
      padding: 16px 0;
    }
    .filter-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .address-select {
      max-width: 300px;
    }
  `]
})
export class UserMailboxComponent implements OnInit {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  addressFilter = '';
  addressFilterOptions = signal<{ title: string; value: string }[]>([]);

  async ngOnInit() {
    await this.fetchAddressData();
  }

  async fetchAddressData() {
    try {
      const { results } = await this.api.getBindAddressList();
      this.addressFilterOptions.set(
        (results || []).map((item: any) => ({
          title: item.name,
          value: item.name,
        }))
      );
    } catch (error: any) {
      console.error(error);
    }
  }

  queryMail() {
    this.addressFilter = this.addressFilter?.trim() || '';
  }

  fetchMailData = async (limit: number, offset: number) => {
    return await this.api.getUserMails(limit, offset, this.addressFilter || undefined);
  };
}
