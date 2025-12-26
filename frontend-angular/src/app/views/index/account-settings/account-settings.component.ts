import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { hashPassword } from '../../../utils/index';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, TranslateModule],
  template: `
    @if (state.settings().address) {
      <div class="settings-container">
        <button mat-stroked-button color="primary" class="full-width mb-2" 
                (click)="state.showAddressCredential.set(true)">
          {{ 'viewCredential' | translate }}
        </button>
        @if (state.openSettings().enableAddressPassword) {
          <button mat-stroked-button color="accent" class="full-width mb-2" (click)="openChangePasswordDialog()">
            {{ 'changePassword' | translate }}
          </button>
        }
        @if (state.openSettings().enableUserDeleteEmail) {
          <button mat-stroked-button color="warn" class="full-width mb-2" (click)="openClearInboxDialog()">
            {{ 'clearInbox' | translate }}
          </button>
          <button mat-stroked-button color="warn" class="full-width mb-2" (click)="openClearSentItemsDialog()">
            {{ 'clearSendbox' | translate }}
          </button>
        }
        <button mat-stroked-button class="full-width mb-2" (click)="openLogoutDialog()">
          {{ 'logout' | translate }}
        </button>
        @if (state.openSettings().enableUserDeleteEmail) {
          <button mat-stroked-button color="warn" class="full-width" (click)="openDeleteAccountDialog()">
            {{ 'deleteAccount' | translate }}
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
  private translate = inject(TranslateService);

  openLogoutDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('logout'), message: this.translate.instant('logoutConfirm'), confirmText: this.translate.instant('logout'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.logout(); });
  }

  openDeleteAccountDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('deleteAccount'), message: this.translate.instant('deleteAccountConfirm'), confirmText: this.translate.instant('deleteAccount'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.deleteAccount(); });
  }

  openClearInboxDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('clearInbox'), message: this.translate.instant('clearInboxConfirm'), confirmText: this.translate.instant('clearInbox'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.clearInbox(); });
  }

  openClearSentItemsDialog() {
    const dialogRef = this.dialog.open(AccountConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('clearSendbox'), message: this.translate.instant('clearSendboxConfirm'), confirmText: this.translate.instant('clearSendbox'), confirmColor: 'warn' }
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
          this.snackbar.success(this.translate.instant('successTip'));
        } catch (e: any) {
          this.snackbar.error(e.message || this.translate.instant('error'));
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
      this.snackbar.error(e.message || this.translate.instant('error'));
    }
  }

  async clearInbox() {
    try {
      await this.api.fetch('/api/clear_inbox', { method: 'DELETE' });
      this.snackbar.success(this.translate.instant('successTip'));
    } catch (e: any) {
      this.snackbar.error(e.message || this.translate.instant('error'));
    }
  }

  async clearSentItems() {
    try {
      await this.api.fetch('/api/clear_sent_items', { method: 'DELETE' });
      this.snackbar.success(this.translate.instant('successTip'));
    } catch (e: any) {
      this.snackbar.error(e.message || this.translate.instant('error'));
    }
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

// Change Password Dialog
@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'changePassword' | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'newPassword' | translate }}</mat-label>
        <input matInput type="password" [(ngModel)]="newPassword">
      </mat-form-field>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'confirmPassword' | translate }}</mat-label>
        <input matInput type="password" [(ngModel)]="confirmPassword">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="submit()">{{ 'changePassword' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class ChangePasswordDialogComponent {
  private dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  newPassword = '';
  confirmPassword = '';

  submit() {
    if (this.newPassword !== this.confirmPassword) {
      this.snackbar.error(this.translate.instant('passwordNotMatch'));
      return;
    }
    this.dialogRef.close(this.newPassword);
  }
}
