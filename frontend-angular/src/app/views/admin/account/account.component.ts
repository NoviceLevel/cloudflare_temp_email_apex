import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

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
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatPaginatorModule, MatCheckboxModule, MatChipsModule, MatMenuModule,
    MatIconModule, MatProgressBarModule, MatDialogModule, TranslateModule
  ],
  template: `
    <div class="account-container">
      <div class="search-row">
        <mat-form-field appearance="outline" class="flex-1">
          <mat-label>{{ 'leaveEmptyQueryAll' | translate }}</mat-label>
          <input matInput [(ngModel)]="addressQuery" (keydown.enter)="fetchData()">
        </mat-form-field>
        <button mat-stroked-button color="primary" (click)="fetchData()">{{ 'query' | translate }}</button>
      </div>
      @if (checkedRowKeys().length > 0) {
        <div class="multi-action-bar">
          <button mat-stroked-button (click)="selectAll()">{{ 'selectAllPage' | translate }}</button>
          <button mat-stroked-button (click)="unselectAll()">{{ 'unselectAll' | translate }}</button>
          <button mat-stroked-button color="warn" (click)="openMultiDeleteDialog()">{{ 'batchDelete' | translate }}</button>
          <button mat-stroked-button color="accent" (click)="openMultiClearInboxDialog()">{{ 'batchClearInbox' | translate }}</button>
          <mat-chip color="primary" highlighted>{{ 'selected' | translate }}: {{ checkedRowKeys().length }}</mat-chip>
        </div>
      }
      <mat-paginator [length]="count()" [pageSize]="pageSize()" [pageSizeOptions]="[20, 50, 100]"
        [pageIndex]="page() - 1" (page)="onPageChange($event)" showFirstLastButtons></mat-paginator>
      <div class="table-container">
        <table mat-table [dataSource]="data()" class="full-width">
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef><mat-checkbox (change)="toggleAllRows($event.checked)" [checked]="isAllSelected()" [indeterminate]="isSomeSelected()"></mat-checkbox></th>
            <td mat-cell *matCellDef="let row"><mat-checkbox [(ngModel)]="row.checked" (change)="updateCheckedKeys()"></mat-checkbox></td>
          </ng-container>
          <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>ID</th><td mat-cell *matCellDef="let row">{{ row.id }}</td></ng-container>
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>{{ 'name' | translate }}</th><td mat-cell *matCellDef="let row">{{ row.name }}</td></ng-container>
          <ng-container matColumnDef="created_at"><th mat-header-cell *matHeaderCellDef>{{ 'createdAt' | translate }}</th><td mat-cell *matCellDef="let row">{{ row.created_at }}</td></ng-container>
          <ng-container matColumnDef="mail_count">
            <th mat-header-cell *matHeaderCellDef>{{ 'mail_count' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              @if (row.mail_count > 0) {
                <button mat-button color="primary" (click)="viewMails(row)"><mat-chip color="primary" highlighted>{{ row.mail_count }}</mat-chip>{{ 'viewMails' | translate }}</button>
              } @else { <mat-chip>{{ row.mail_count }}</mat-chip> }
            </td>
          </ng-container>
          <ng-container matColumnDef="send_count"><th mat-header-cell *matHeaderCellDef>{{ 'send_count' | translate }}</th><td mat-cell *matCellDef="let row"><mat-chip>{{ row.send_count }}</mat-chip></td></ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>{{ 'actions' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="showCredentialDialog(row.id)">{{ 'viewCredential' | translate }}</button>
                @if (row.mail_count > 0) {
                  <button mat-menu-item (click)="viewMails(row)">{{ 'viewMails' | translate }}</button>
                  <button mat-menu-item (click)="openClearInboxDialog(row)">{{ 'clearInbox' | translate }}</button>
                }
                <button mat-menu-item (click)="openDeleteDialog(row)">{{ 'delete' | translate }}</button>
              </mat-menu>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .account-container { padding: 16px 0; }
    .search-row { display: flex; gap: 8px; margin-bottom: 16px; }
    .flex-1 { flex: 1; }
    .multi-action-bar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px; }
    .table-container { overflow: auto; }
    .full-width { width: 100%; min-width: 800px; }
  `]
})
export class AdminAccountComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  displayedColumns = ['select', 'id', 'name', 'created_at', 'mail_count', 'send_count', 'actions'];
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

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.fetchData();
  }

  updateCheckedKeys() { this.checkedRowKeys.set(this.data().filter(row => row.checked).map(row => row.id)); }
  isAllSelected(): boolean { return this.data().length > 0 && this.data().every(row => row.checked); }
  isSomeSelected(): boolean { return this.data().some(row => row.checked) && !this.isAllSelected(); }
  toggleAllRows(checked: boolean) { this.data.update(rows => rows.map(row => ({ ...row, checked }))); this.updateCheckedKeys(); }
  selectAll() { this.toggleAllRows(true); }
  unselectAll() { this.toggleAllRows(false); }

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
      width: '320px',
      data: { title: this.translate.instant('deleteEmail'), message: this.translate.instant('deleteEmailConfirm'), confirmText: this.translate.instant('delete'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.adminDeleteAddress(row.id);
          this.snackbar.success(this.translate.instant('success'));
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || 'error');
        }
      }
    });
  }

  openClearInboxDialog(row: AccountRow) {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('clearInbox'), message: this.translate.instant('clearInboxConfirm'), confirmText: this.translate.instant('clear'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.fetch(`/admin/clear_inbox/${row.id}`, { method: 'DELETE' });
          this.snackbar.success(this.translate.instant('success'));
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || 'error');
        }
      }
    });
  }

  openMultiDeleteDialog() {
    const selectedIds = this.checkedRowKeys();
    if (selectedIds.length === 0) { this.snackbar.error(this.translate.instant('pleaseSelectAddress')); return; }
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('batchDelete'), message: this.translate.instant('batchDeleteConfirm'), confirmText: this.translate.instant('delete'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) await this.multiDeleteAccounts(selectedIds);
    });
  }

  openMultiClearInboxDialog() {
    const selectedRows = this.data().filter(row => this.checkedRowKeys().includes(row.id) && row.mail_count > 0);
    if (selectedRows.length === 0) { this.snackbar.error(this.translate.instant('pleaseSelectAddressWithMails')); return; }
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('batchClearInbox'), message: this.translate.instant('batchClearInboxConfirm'), confirmText: this.translate.instant('clear'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) await this.multiClearInbox(selectedRows);
    });
  }

  async multiDeleteAccounts(selectedIds: number[]) {
    const progressRef = this.dialog.open(ProgressDialogComponent, { width: '400px', disableClose: true, data: { title: this.translate.instant('batchDelete'), total: selectedIds.length } });
    for (let i = 0; i < selectedIds.length; i++) {
      try { await this.api.adminDeleteAddress(selectedIds[i]); } catch (error) { console.error(error); }
      progressRef.componentInstance.updateProgress(i + 1);
    }
    progressRef.close();
    this.snackbar.success(this.translate.instant('success'));
    this.checkedRowKeys.set([]);
    await this.fetchData();
  }

  async multiClearInbox(selectedRows: AccountRow[]) {
    const progressRef = this.dialog.open(ProgressDialogComponent, { width: '400px', disableClose: true, data: { title: this.translate.instant('batchClearInbox'), total: selectedRows.length } });
    for (let i = 0; i < selectedRows.length; i++) {
      try { await this.api.fetch(`/admin/clear_inbox/${selectedRows[i].id}`, { method: 'DELETE' }); } catch (error) { console.error(error); }
      progressRef.componentInstance.updateProgress(i + 1);
    }
    progressRef.close();
    this.snackbar.success(this.translate.instant('success'));
    this.checkedRowKeys.set([]);
    await this.fetchData();
  }
}

// Confirm Dialog
@Component({
  selector: 'app-account-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class AccountConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Credential Dialog
@Component({
  selector: 'app-account-credential-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'addressCredential' | translate }}</h2>
    <mat-dialog-content>
      <p class="mb-3">{{ 'addressCredentialTip' | translate }}</p>
      <div class="credential-box"><strong>{{ data.jwt }}</strong></div>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>{{ 'close' | translate }}</button></mat-dialog-actions>
  `,
  styles: [`.mb-3 { margin-bottom: 12px; } .credential-box { background: #f5f5f5; padding: 16px; border-radius: 4px; word-break: break-all; }`]
})
export class AccountCredentialDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Progress Dialog
@Component({
  selector: 'app-progress-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <mat-progress-bar mode="determinate" [value]="progressValue"></mat-progress-bar>
      <p class="text-center mt-2">{{ current }}/{{ data.total }}</p>
    </mat-dialog-content>
  `,
  styles: [`.text-center { text-align: center; } .mt-2 { margin-top: 8px; }`]
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
