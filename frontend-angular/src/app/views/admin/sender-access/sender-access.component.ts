import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-sender-access',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatTableModule, MatChipsModule, MatCheckboxModule, MatSelectModule, MatDialogModule
  ],
  template: `
    <div class="container">
      <div class="search-row mb-3">
        <mat-form-field appearance="outline" class="flex-grow">
          <input matInput [(ngModel)]="addressQuery" (keydown.enter)="fetchData()" placeholder="搜索地址">
        </mat-form-field>
        <button mat-stroked-button color="primary" (click)="fetchData()">查询</button>
      </div>
      <div class="pagination-row mb-3">
        <span>总数: {{ count() }}</span>
        <button mat-stroked-button [disabled]="page() <= 1" (click)="page.set(page() - 1); fetchData()">上一页</button>
        <span>{{ page() }} / {{ totalPages() }}</span>
        <button mat-stroked-button [disabled]="page() >= totalPages()" (click)="page.set(page() + 1); fetchData()">下一页</button>
        <mat-form-field appearance="outline" style="width: 80px;">
          <mat-select [(ngModel)]="pageSize" (selectionChange)="fetchData()">
            <mat-option [value]="20">20</mat-option>
            <mat-option [value]="50">50</mat-option>
            <mat-option [value]="100">100</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
      <div class="table-container">
        <table mat-table [dataSource]="data()" class="full-width">
          <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>ID</th><td mat-cell *matCellDef="let row">{{ row.id }}</td></ng-container>
          <ng-container matColumnDef="address"><th mat-header-cell *matHeaderCellDef>地址</th><td mat-cell *matCellDef="let row">{{ row.address }}</td></ng-container>
          <ng-container matColumnDef="created_at"><th mat-header-cell *matHeaderCellDef>创建时间</th><td mat-cell *matCellDef="let row">{{ row.created_at }}</td></ng-container>
          <ng-container matColumnDef="balance"><th mat-header-cell *matHeaderCellDef>余额</th><td mat-cell *matCellDef="let row">{{ row.balance }}</td></ng-container>
          <ng-container matColumnDef="enabled"><th mat-header-cell *matHeaderCellDef>是否启用</th><td mat-cell *matCellDef="let row"><span class="chip" [class.enabled]="row.enabled">{{ row.enabled ? '启用' : '禁用' }}</span></td></ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let row">
              <button mat-stroked-button color="primary" class="mr-2" (click)="openModifyDialog(row)">修改</button>
              <button mat-stroked-button color="warn" (click)="openDeleteDialog(row)">删除</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 16px; }
    .search-row { display: flex; gap: 8px; align-items: center; }
    .flex-grow { flex: 1; }
    .pagination-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
    .mr-2 { margin-right: 8px; }
    .chip { padding: 4px 8px; border-radius: 16px; font-size: 12px; background: #eee; }
    .chip.enabled { background: #c8e6c9; color: #2e7d32; }
  `]
})
export class SenderAccessComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  displayedColumns = ['id', 'address', 'created_at', 'balance', 'enabled', 'actions'];
  data = signal<any[]>([]);
  count = signal(0);
  page = signal(1);
  pageSize = 20;
  addressQuery = '';

  totalPages = computed(() => Math.ceil(this.count() / this.pageSize) || 1);

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const query = this.addressQuery.trim();
      let url = `/admin/address_sender?limit=${this.pageSize}&offset=${(this.page() - 1) * this.pageSize}`;
      if (query) url += `&address=${encodeURIComponent(query)}`;
      const res = await this.api.fetch<any>(url);
      this.data.set(res.results || []);
      if (res.count > 0) this.count.set(res.count);
    } catch (error: any) {
      this.snackbar.error(error.message || '获取数据失败');
    }
  }

  openModifyDialog(row: any) {
    const dialogRef = this.dialog.open(SenderModifyDialogComponent, {
      width: '400px',
      data: { address: row.address, balance: row.balance, enabled: !!row.enabled }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.fetch('/admin/address_sender', {
            method: 'POST',
            body: { address: row.address, address_id: row.id, balance: result.balance, enabled: result.enabled ? 1 : 0 }
          });
          this.snackbar.success('修改成功');
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || '修改失败');
        }
      }
    });
  }

  openDeleteDialog(row: any) {
    const dialogRef = this.dialog.open(SenderDeleteDialogComponent, { width: '320px' });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.fetch(`/admin/address_sender/${row.id}`, { method: 'DELETE' });
          this.snackbar.success('删除成功');
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || '删除失败');
        }
      }
    });
  }
}

// Modify Dialog
@Component({
  selector: 'app-sender-modify-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCheckboxModule],
  template: `
    <h2 mat-dialog-title>{{ data.address }}</h2>
    <mat-dialog-content>
      <p class="mb-3">请输入发件额度</p>
      <mat-checkbox [(ngModel)]="enabled" class="mb-2">启用</mat-checkbox>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>余额</mat-label>
        <input matInput type="number" [(ngModel)]="balance" min="0" max="1000">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="{balance, enabled}">确定</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; } .mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; }`]
})
export class SenderModifyDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  balance = this.data.balance;
  enabled = this.data.enabled;
}

// Delete Dialog
@Component({
  selector: 'app-sender-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>删除</h2>
    <mat-dialog-content>确定删除吗？</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">删除</button>
    </mat-dialog-actions>
  `
})
export class SenderDeleteDialogComponent {}
