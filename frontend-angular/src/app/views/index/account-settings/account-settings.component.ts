import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { hashPassword } from '../../../utils/index';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    @if (state.settings().address) {
      <div class="settings-container">
        <button mat-stroked-button color="primary" class="full-width mb-2" 
                (click)="state.showAddressCredential.set(true)">
          查看邮箱地址凭证
        </button>
        @if (state.openSettings().enableAddressPassword) {
          <button mat-stroked-button color="accent" class="full-width mb-2" (click)="openChangePasswordDialog()">
            修改密码
          </button>
        }
        @if (state.openSettings().enableUserDeleteEmail) {
          <button mat-stroked-button color="warn" class="full-width mb-2" (click)="openClearInboxDialog()">
            清空收件箱
          </button>
          <button mat-stroked-button color="warn" class="full-width mb-2" (click)="openClearSentItemsDialog()">
            清空发件箱
          </button>
        }
        <button mat-stroked-button class="full-width mb-2" (click)="openLogoutDialog()">
          退出登录
        </button>
        @if (state.openSettings().enableUserDeleteEmail) {
          <button mat-stroked-button color="warn" class="full-width" (click)="openDeleteAccountDialog()">
            删除账户
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .settings-container { max-width: 400px; margin: 0 auto; }
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
  `]
})
export class AccountSettingsComponent {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  openLogoutDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: '退出登录', message: '确定要退出登录吗？', confirmText: '退出登录', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.logout(); });
  }

  openDeleteAccountDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: '删除账户', message: '确定要删除你的账户和其中的所有邮件吗?', confirmText: '删除账户', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.deleteAccount(); });
  }

  openClearInboxDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: '清空收件箱', message: '确定要清空你收件箱中的所有邮件吗？', confirmText: '清空收件箱', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.clearInbox(); });
  }

  openClearSentItemsDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: '清空发件箱', message: '确定要清空你发件箱中的所有邮件吗？', confirmText: '清空发件箱', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.clearSentItems(); });
  }

  openChangePasswordDialog() {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.api.fetch('/api/address_change_password', {
            method: 'POST',
            body: { new_password: await hashPassword(result) }
          });
          this.snackbar.success('密码修改成功');
        } catch (e: any) {
          this.snackbar.error(e.message || '修改失败');
        }
      }
    });
  }

  async logout() {
    this.state.setJwt('');
    await this.router.navigate(['/']);
    location.reload();
  }

  async deleteAccount() {
    try {
      await this.api.fetch('/api/delete_address', { method: 'DELETE' });
      this.state.setJwt('');
      await this.router.navigate(['/']);
      location.reload();
    } catch (e: any) {
      this.snackbar.error(e.message || '删除失败');
    }
  }

  async clearInbox() {
    try {
      await this.api.fetch('/api/clear_inbox', { method: 'DELETE' });
      this.snackbar.success('清空成功');
    } catch (e: any) {
      this.snackbar.error(e.message || '清空失败');
    }
  }

  async clearSentItems() {
    try {
      await this.api.fetch('/api/clear_sent_items', { method: 'DELETE' });
      this.snackbar.success('清空成功');
    } catch (e: any) {
      this.snackbar.error(e.message || '清空失败');
    }
  }
}

// Confirm Dialog
@Component({
  selector: 'app-account-confirm-dialog',
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
export class AccountConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Change Password Dialog
@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>修改密码</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>新密码</mat-label>
        <input matInput type="password" [(ngModel)]="newPassword">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>确认密码</mat-label>
        <input matInput type="password" [(ngModel)]="confirmPassword">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" (click)="submit()">修改密码</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class ChangePasswordDialogComponent {
  private dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private snackbar = inject(SnackbarService);
  newPassword = '';
  confirmPassword = '';

  submit() {
    if (this.newPassword !== this.confirmPassword) {
      this.snackbar.error('密码不匹配');
      return;
    }
    this.dialogRef.close(this.newPassword);
  }
}
