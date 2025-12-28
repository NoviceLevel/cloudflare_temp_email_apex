import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

interface AccountRow {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  mail_count: number;
  send_count: number;
  checked?: boolean;
}

@Component({
  selector: 'app-admin-account',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatMenuModule, MatIconModule, MatProgressBarModule,
    MatDialogModule, MatPaginatorModule, TranslateModule
  ],
  template: `
    <div class="account-page">
      <!-- 搜索和操作栏 -->
      <div class="admin-card mb-4">
        <div class="table-toolbar">
          <div class="table-search">
            <mat-icon>search</mat-icon>
            <input type="text" [(ngModel)]="addressQuery" (keydown.enter)="fetchData()" placeholder="搜索邮箱地址..." class="search-input">
            <button mat-icon-button (click)="fetchData()"><mat-icon>arrow_forward</mat-icon></button>
          </div>
          <div class="table-actions">
            @if (checkedRowKeys().length > 0) {
              <span class="selected-count">已选择 {{ checkedRowKeys().length }} 项</span>
              <button mat-stroked-button color="warn" (click)="openMultiDeleteDialog()">
                <mat-icon>delete</mat-icon>批量删除
              </button>
              <button mat-stroked-button (click)="openMultiClearInboxDialog()">
                <mat-icon>cleaning_services</mat-icon>批量清空
              </button>
            }
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="admin-card">
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th style="width: 48px;">
                  <mat-checkbox (change)="toggleAllRows($event.checked)" [checked]="isAllSelected()" [indeterminate]="isSomeSelected()"></mat-checkbox>
                </th>
                <th>邮箱地址</th>
                <th style="width: 160px;">创建时间</th>
                <th style="width: 100px;">收件数</th>
                <th style="width: 100px;">发件数</th>
                <th style="width: 80px;">操作</th>
              </tr>
            </thead>
            <tbody>
              @for (row of data(); track row.id) {
                <tr>
                  <td><mat-checkbox [(ngModel)]="row.checked" (change)="updateCheckedKeys()"></mat-checkbox></td>
                  <td>
                    <div class="account-cell">
                      <div class="account-avatar">{{ row.name.charAt(0).toUpperCase() }}</div>
                      <span class="account-name">{{ row.name }}</span>
                    </div>
                  </td>
                  <td class="text-secondary">{{ formatDate(row.created_at) }}</td>
                  <td>
                    @if (row.mail_count > 0) {
                      <button mat-button color="primary" class="count-btn" (click)="viewMails(row)">{{ row.mail_count }}</button>
                    } @else {
                      <span class="admin-chip neutral">0</span>
                    }
                  </td>
                  <td><span class="admin-chip neutral">{{ row.send_count }}</span></td>
                  <td>
                    <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
                    <mat-menu #menu="matMenu">
                      <button mat-menu-item (click)="showCredentialDialog(row.id)"><mat-icon>key</mat-icon>查看凭证</button>
                      @if (row.mail_count > 0) {
                        <button mat-menu-item (click)="viewMails(row)"><mat-icon>mail</mat-icon>查看邮件</button>
                        <button mat-menu-item (click)="openClearInboxDialog(row)"><mat-icon>cleaning_services</mat-icon>清空收件箱</button>
                      }
                      <button mat-menu-item (click)="openDeleteDialog(row)" class="text-warn"><mat-icon>delete</mat-icon>删除</button>
                    </mat-menu>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-row">
                    <mat-icon>inbox</mat-icon>
                    <span>暂无数据</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <mat-paginator [length]="count()" [pageSize]="pageSize()" [pageSizeOptions]="[20, 50, 100]"
          [pageIndex]="page() - 1" (page)="onPageChange($event)" showFirstLastButtons></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .account-page { }
    .mb-4 { margin-bottom: 24px; }
    .search-input { flex: 1; border: none; outline: none; font-size: 14px; background: transparent; padding: 8px; }
    :host-context(.dark) .search-input { color: #e8eaed; }
    .selected-count { font-size: 14px; color: #1a73e8; font-weight: 500; }
    .account-cell { display: flex; align-items: center; gap: 12px; }
    .account-avatar { width: 32px; height: 32px; border-radius: 50%; background: #1a73e8; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; }
    .account-name { font-weight: 500; }
    .text-secondary { color: #5f6368; }
    :host-context(.dark) .text-secondary { color: #9aa0a6; }
    .count-btn { min-width: auto; padding: 0 8px; }
    .text-warn { color: #c5221f !important; }
    .empty-row { text-align: center; padding: 48px !important; color: #5f6368; }
    .empty-row mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.5; display: block; margin: 0 auto 8px; }
  `]
})
export class AdminAccountComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  data = signal<AccountRow[]>([]);
  count = signal(0);
  page = signal(1);
  pageSize = signal(20);
  addressQuery = '';
  checkedRowKeys = signal<number[]>([]);

  async ngOnInit() { await this.fetchData(); }

  async fetchData() {
    try {
      const { results, count } = await this.api.adminGetAccounts(this.pageSize(), (this.page() - 1) * this.pageSize(), this.addressQuery.trim() || undefined);
      this.data.set(results || []);
      if (count > 0) this.count.set(count);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.fetchData();
  }

  updateCheckedKeys() { this.checkedRowKeys.set(this.data().filter(row => row.checked).map(row => row.id)); }
  isAllSelected(): boolean { return this.data().length > 0 && this.data().every(row => row.checked); }
  isSomeSelected(): boolean { return this.data().some(row => row.checked) && !this.isAllSelected(); }
  toggleAllRows(checked: boolean) { this.data.update(rows => rows.map(row => ({ ...row, checked }))); this.updateCheckedKeys(); }

  viewMails(row: AccountRow) {
    if (row.mail_count > 0) {
      this.state.adminMailTabAddress.set(row.name);
      this.state.setAdminTab('mails');
    }
  }

  async showCredentialDialog(id: number) {
    try {
      const res = await this.api.adminShowAddressCredential(id);
      this.dialog.open(AccountCredentialDialogComponent, { width: '500px', data: { jwt: (res as any).jwt || res } });
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  openDeleteDialog(row: AccountRow) {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '400px',
      data: { title: '删除邮箱', message: `确定要删除邮箱 "${row.name}" 吗？此操作不可恢复。`, confirmText: '删除', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.adminDeleteAddress(row.id);
          this.snackbar.success('删除成功');
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || 'error');
        }
      }
    });
  }

  openClearInboxDialog(row: AccountRow) {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '400px',
      data: { title: '清空收件箱', message: `确定要清空 "${row.name}" 的所有邮件吗？`, confirmText: '清空', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.fetch(`/admin/clear_inbox/${row.id}`, { method: 'DELETE' });
          this.snackbar.success('清空成功');
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || 'error');
        }
      }
    });
  }

  openMultiDeleteDialog() {
    const selectedIds = this.checkedRowKeys();
    if (selectedIds.length === 0) return;
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '400px',
      data: { title: '批量删除', message: `确定要删除选中的 ${selectedIds.length} 个邮箱吗？`, confirmText: '删除', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) await this.multiDeleteAccounts(selectedIds);
    });
  }

  openMultiClearInboxDialog() {
    const selectedRows = this.data().filter(row => this.checkedRowKeys().includes(row.id) && row.mail_count > 0);
    if (selectedRows.length === 0) { this.snackbar.error('请选择有邮件的账号'); return; }
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '400px',
      data: { title: '批量清空', message: `确定要清空选中的 ${selectedRows.length} 个邮箱的收件箱吗？`, confirmText: '清空', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) await this.multiClearInbox(selectedRows);
    });
  }

  async multiDeleteAccounts(selectedIds: number[]) {
    const progressRef = this.dialog.open(ProgressDialogComponent, { width: '400px', disableClose: true, data: { title: '批量删除', total: selectedIds.length } });
    for (let i = 0; i < selectedIds.length; i++) {
      try { await this.api.adminDeleteAddress(selectedIds[i]); } catch (error) { console.error(error); }
      progressRef.componentInstance.updateProgress(i + 1);
    }
    progressRef.close();
    this.snackbar.success('删除完成');
    this.checkedRowKeys.set([]);
    await this.fetchData();
  }

  async multiClearInbox(selectedRows: AccountRow[]) {
    const progressRef = this.dialog.open(ProgressDialogComponent, { width: '400px', disableClose: true, data: { title: '批量清空', total: selectedRows.length } });
    for (let i = 0; i < selectedRows.length; i++) {
      try { await this.api.fetch(`/admin/clear_inbox/${selectedRows[i].id}`, { method: 'DELETE' }); } catch (error) { console.error(error); }
      progressRef.componentInstance.updateProgress(i + 1);
    }
    progressRef.close();
    this.snackbar.success('清空完成');
    this.checkedRowKeys.set([]);
    await this.fetchData();
  }
}

@Component({
  selector: 'app-account-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-icon" [class.warn]="data.confirmColor === 'warn'">
        <mat-icon>{{ data.confirmColor === 'warn' ? 'warning' : 'help' }}</mat-icon>
      </div>
      <h2>{{ data.title }}</h2>
      <p>{{ data.message }}</p>
      <div class="dialog-actions">
        <button mat-button mat-dialog-close>取消</button>
        <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">{{ data.confirmText }}</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog { text-align: center; padding: 16px; }
    .dialog-icon { width: 64px; height: 64px; border-radius: 50%; background: #e8f0fe; color: #1a73e8; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
    .dialog-icon.warn { background: #fce8e6; color: #c5221f; }
    .dialog-icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    h2 { font-size: 20px; font-weight: 500; margin: 0 0 8px; }
    p { color: #5f6368; margin: 0 0 24px; }
    .dialog-actions { display: flex; justify-content: center; gap: 12px; }
  `]
})
export class AccountConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-account-credential-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>地址凭证</h2>
    <mat-dialog-content>
      <p class="hint">此凭证可用于 API 访问，请妥善保管</p>
      <div class="credential-box">
        <code>{{ data.jwt }}</code>
        <button mat-icon-button (click)="copy()" matTooltip="复制"><mat-icon>content_copy</mat-icon></button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>关闭</button></mat-dialog-actions>
  `,
  styles: [`
    .hint { color: #5f6368; margin-bottom: 16px; }
    .credential-box { background: #f8f9fa; padding: 16px; border-radius: 8px; word-break: break-all; font-size: 12px; display: flex; align-items: flex-start; gap: 8px; }
    .credential-box code { flex: 1; }
  `]
})
export class AccountCredentialDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  copy() { navigator.clipboard.writeText(this.data.jwt); }
}

@Component({
  selector: 'app-progress-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-progress-bar mode="determinate" [value]="progressValue"></mat-progress-bar>
      <p class="progress-text">{{ current }} / {{ data.total }}</p>
    </mat-dialog-content>
  `,
  styles: [`.progress-text { text-align: center; margin-top: 16px; color: #5f6368; }`]
})
export class ProgressDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  current = 0;
  progressValue = 0;
  updateProgress(current: number) {
    this.current = current;
    this.progressValue = Math.floor(current / this.data.total * 100);
  }
}
