import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { hashPassword } from '../../../utils';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatTableModule, MatPaginatorModule, MatIconModule, MatMenuModule, MatChipsModule, MatSelectModule, MatDialogModule
  ],
  template: `
    <div class="container">
      <div class="search-row mb-3">
        <mat-form-field appearance="outline" class="flex-grow">
          <input matInput [(ngModel)]="userQuery" (keydown.enter)="fetchData()" placeholder="搜索用户">
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
        <button mat-stroked-button color="primary" (click)="openCreateUserDialog()">创建用户</button>
      </div>
      <div class="table-container">
        <table mat-table [dataSource]="data()" class="full-width">
          <ng-container matColumnDef="id"><th mat-header-cell *matHeaderCellDef>ID</th><td mat-cell *matCellDef="let row">{{ row.id }}</td></ng-container>
          <ng-container matColumnDef="user_email"><th mat-header-cell *matHeaderCellDef>用户邮箱</th><td mat-cell *matCellDef="let row">{{ row.user_email }}</td></ng-container>
          <ng-container matColumnDef="role_text"><th mat-header-cell *matHeaderCellDef>角色</th><td mat-cell *matCellDef="let row">@if (row.role_text) {<span class="chip">{{ row.role_text }}</span>}</td></ng-container>
          <ng-container matColumnDef="address_count"><th mat-header-cell *matHeaderCellDef>地址数量</th><td mat-cell *matCellDef="let row">{{ row.address_count }}</td></ng-container>
          <ng-container matColumnDef="created_at"><th mat-header-cell *matHeaderCellDef>创建时间</th><td mat-cell *matCellDef="let row">{{ row.created_at }}</td></ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>操作</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="openChangeRoleDialog(row)">更改角色</button>
                <button mat-menu-item (click)="openResetPasswordDialog(row)">重置密码</button>
                <button mat-menu-item (click)="openDeleteUserDialog(row)">删除</button>
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
    .container { padding: 16px; }
    .search-row { display: flex; gap: 8px; align-items: center; }
    .flex-grow { flex: 1; }
    .pagination-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .table-container { overflow-x: auto; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
    .chip { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 16px; font-size: 12px; }
  `]
})
export class UserManagementComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  displayedColumns = ['id', 'user_email', 'role_text', 'address_count', 'created_at', 'actions'];
  data = signal<any[]>([]);
  count = signal(0);
  page = signal(1);
  pageSize = 20;
  userQuery = '';
  userRoles = signal<any[]>([]);
  curUserId = 0;

  totalPages = computed(() => Math.ceil(this.count() / this.pageSize) || 1);

  async ngOnInit() {
    await this.fetchUserRoles();
    await this.fetchData();
  }

  async fetchUserRoles() {
    try {
      const results = await this.api.fetch<any[]>('/admin/user_roles');
      this.userRoles.set(results || []);
    } catch (error: any) {
      console.error(error);
    }
  }

  async fetchData() {
    try {
      const query = this.userQuery.trim();
      let url = `/admin/users?limit=${this.pageSize}&offset=${(this.page() - 1) * this.pageSize}`;
      if (query) url += `&query=${encodeURIComponent(query)}`;
      const res = await this.api.fetch<any>(url);
      this.data.set(res.results || []);
      if (res.count > 0) this.count.set(res.count);
    } catch (error: any) {
      this.snackbar.error(error.message || '获取数据失败');
    }
  }

  openCreateUserDialog() {
    const dialogRef = this.dialog.open(CreateUserDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.fetch('/admin/users', {
            method: 'POST',
            body: { email: result.email, password: await hashPassword(result.password) }
          });
          this.snackbar.success('创建成功');
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || '创建失败');
        }
      }
    });
  }

  openResetPasswordDialog(row: any) {
    this.curUserId = row.id;
    const dialogRef = this.dialog.open(ResetPasswordDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(async (password) => {
      if (password) {
        try {
          await this.api.fetch(`/admin/users/${this.curUserId}/reset_password`, {
            method: 'POST',
            body: { password: await hashPassword(password) }
          });
          this.snackbar.success('重置成功');
        } catch (error: any) {
          this.snackbar.error(error.message || '重置失败');
        }
      }
    });
  }

  openDeleteUserDialog(row: any) {
    this.curUserId = row.id;
    const dialogRef = this.dialog.open(AdminConfirmDialogComponent, {
      width: '320px',
      data: { title: '删除用户', message: '确定要删除此用户吗？', confirmText: '删除', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.fetch(`/admin/users/${this.curUserId}`, { method: 'DELETE' });
          this.snackbar.success('删除成功');
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || '删除失败');
        }
      }
    });
  }

  openChangeRoleDialog(row: any) {
    this.curUserId = row.id;
    const dialogRef = this.dialog.open(ChangeRoleDialogComponent, {
      width: '400px',
      data: { currentRole: row.role_text || '', userRoles: this.userRoles() }
    });
    dialogRef.afterClosed().subscribe(async (role) => {
      if (role !== undefined) {
        try {
          await this.api.fetch('/admin/user_roles', {
            method: 'POST',
            body: { user_id: this.curUserId, role_text: role }
          });
          this.snackbar.success('更改成功');
          await this.fetchData();
        } catch (error: any) {
          this.snackbar.error(error.message || '更改失败');
        }
      }
    });
  }
}

// Admin Confirm Dialog
@Component({
  selector: 'app-admin-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class AdminConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Create User Dialog
@Component({
  selector: 'app-create-user-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>创建用户</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width mb-2">
        <mat-label>邮箱</mat-label>
        <input matInput [(ngModel)]="email">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>密码</mat-label>
        <input matInput type="password" [(ngModel)]="password">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="{email, password}" [disabled]="!email || !password">创建</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; } .mb-2 { margin-bottom: 8px; }`]
})
export class CreateUserDialogComponent {
  email = '';
  password = '';
}

// Reset Password Dialog
@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>重置密码</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>新密码</mat-label>
        <input matInput type="password" [(ngModel)]="password">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="password" [disabled]="!password">重置</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class ResetPasswordDialogComponent {
  password = '';
}

// Change Role Dialog
@Component({
  selector: 'app-change-role-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>更改角色</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>角色</mat-label>
        <mat-select [(ngModel)]="role">
          <mat-option [value]="''">无</mat-option>
          @for (r of data.userRoles; track r.role) {
            <mat-option [value]="r.role">{{ r.role }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="role">保存</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class ChangeRoleDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  role = this.data.currentRole;
}
