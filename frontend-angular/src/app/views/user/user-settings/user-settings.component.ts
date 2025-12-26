import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

interface PasskeyRow {
  passkey_id: string;
  passkey_name: string;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatTableModule, MatIconModule, MatDialogModule, TranslateModule],
  template: `
    @if (state.userSettings().user_email) {
      <div class="user-settings-container">
        <mat-card appearance="outlined">
          <mat-card-content>
            <button mat-stroked-button class="full-width mb-2" (click)="openPasskeyListDialog()">{{ 'viewPasskeyList' | translate }}</button>
            <button mat-stroked-button color="primary" class="full-width mb-2" (click)="openCreatePasskeyDialog()">{{ 'createPasskey' | translate }}</button>
            <div class="info-alert mb-2">
              <mat-icon>info</mat-icon>
              <span>{{ 'passwordHashTip' | translate }}</span>
            </div>
            <button mat-stroked-button class="full-width" (click)="openLogoutDialog()">{{ 'logout' | translate }}</button>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .user-settings-container { display: flex; justify-content: center; }
    mat-card { max-width: 600px; width: 100%; }
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .info-alert {
      display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px;
      background-color: #e3f2fd; border-radius: 4px; color: #1976d2;
    }
    .info-alert mat-icon { flex-shrink: 0; }
    :host-context(.dark-theme) .info-alert { background-color: #1e3a5f; color: #90caf9; }
  `]
})
export class UserSettingsComponent {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  passkeyData = signal<PasskeyRow[]>([]);

  openLogoutDialog() {
    const dialogRef = this.dialog.open(UserConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('logout'), message: this.translate.instant('logoutConfirm'), confirmText: this.translate.instant('logout'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.logout(); });
  }

  logout() {
    this.state.setUserJwt('');
    location.reload();
  }

  openCreatePasskeyDialog() {
    const dialogRef = this.dialog.open(CreatePasskeyDialogComponent, { width: '400px' });
    dialogRef.afterClosed().subscribe(async (name) => {
      if (name !== undefined) {
        await this.createPasskey(name);
      }
    });
  }

  async createPasskey(passkeyName: string) {
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      const options = await this.api.passkeyRegisterRequest(location.hostname);
      const credential = await startRegistration(options);
      const name = passkeyName || `${(navigator as any).userAgentData?.platform || 'Unknown'}: ${Math.random().toString(36).substring(7)}`;
      await this.api.passkeyRegisterResponse(location.origin, name, credential);
      this.snackbar.success(this.translate.instant('passkeyCreated'));
    } catch (error: any) {
      console.error(error);
      this.snackbar.error(error.message || 'error');
    }
  }

  async openPasskeyListDialog() {
    await this.fetchPasskeyList();
    const dialogRef = this.dialog.open(PasskeyListDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      data: { passkeyData: this.passkeyData() }
    });
    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.action === 'rename') {
        await this.renamePasskey(result.id, result.name);
        await this.fetchPasskeyList();
      } else if (result?.action === 'delete') {
        await this.deletePasskey(result.id);
        await this.fetchPasskeyList();
      }
    });
  }

  async fetchPasskeyList() {
    try {
      const data = await this.api.getPasskeyList();
      this.passkeyData.set(data || []);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async renamePasskey(id: string, name: string) {
    try {
      await this.api.renamePasskey(id, name);
      this.snackbar.success(this.translate.instant('successTip'));
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async deletePasskey(id: string) {
    try {
      await this.api.deletePasskey(id);
      this.snackbar.success(this.translate.instant('deleteSuccess'));
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}

@Component({
  selector: 'app-user-confirm-dialog',
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
export class UserConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-create-passkey-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'createPasskey' | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>{{ 'passkeyName' | translate }}</mat-label>
        <input matInput [(ngModel)]="passkeyName" [placeholder]="'passkeyNamePlaceholder' | translate">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="passkeyName">{{ 'createPasskey' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class CreatePasskeyDialogComponent {
  passkeyName = '';
}

@Component({
  selector: 'app-passkey-list-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatTableModule, MatFormFieldModule, MatInputModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'passkeyList' | translate }}</h2>
    <mat-dialog-content>
      <div class="table-container">
        <table mat-table [dataSource]="data.passkeyData" class="full-width">
          <ng-container matColumnDef="passkey_id">
            <th mat-header-cell *matHeaderCellDef>Passkey ID</th>
            <td mat-cell *matCellDef="let row">{{ row.passkey_id }}</td>
          </ng-container>
          <ng-container matColumnDef="passkey_name">
            <th mat-header-cell *matHeaderCellDef>{{ 'name' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.passkey_name }}</td>
          </ng-container>
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>{{ 'createdAt' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.created_at }}</td>
          </ng-container>
          <ng-container matColumnDef="updated_at">
            <th mat-header-cell *matHeaderCellDef>{{ 'updatedAt' | translate }}</th>
            <td mat-cell *matCellDef="let row">{{ row.updated_at }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>{{ 'actions' | translate }}</th>
            <td mat-cell *matCellDef="let row">
              <button mat-button color="primary" (click)="openRename(row)">{{ 'rename' | translate }}</button>
              <button mat-button color="warn" (click)="openDelete(row)">{{ 'delete' | translate }}</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="passkeyColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: passkeyColumns;"></tr>
        </table>
      </div>
      @if (showRename) {
        <div class="rename-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'newName' | translate }}</mat-label>
            <input matInput [(ngModel)]="newName">
          </mat-form-field>
          <div class="action-buttons">
            <button mat-button (click)="showRename = false">{{ 'cancel' | translate }}</button>
            <button mat-raised-button color="primary" (click)="confirmRename()">{{ 'confirmRename' | translate }}</button>
          </div>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'close' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .table-container { overflow: auto; max-height: 400px; }
    .full-width { width: 100%; }
    .rename-section { margin-top: 16px; padding: 16px; background: rgba(0,0,0,0.05); border-radius: 8px; }
    .action-buttons { display: flex; justify-content: flex-end; gap: 8px; }
  `]
})
export class PasskeyListDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<PasskeyListDialogComponent>);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  passkeyColumns = ['passkey_id', 'passkey_name', 'created_at', 'updated_at', 'actions'];
  showRename = false;
  currentId = '';
  newName = '';

  openRename(row: PasskeyRow) {
    this.currentId = row.passkey_id;
    this.newName = '';
    this.showRename = true;
  }

  confirmRename() {
    this.dialogRef.close({ action: 'rename', id: this.currentId, name: this.newName });
  }

  openDelete(row: PasskeyRow) {
    const confirmRef = this.dialog.open(UserConfirmDialogComponent, {
      width: '320px',
      data: { title: this.translate.instant('deletePasskey'), message: this.translate.instant('deletePasskeyConfirm'), confirmText: this.translate.instant('delete'), confirmColor: 'warn' }
    });
    confirmRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close({ action: 'delete', id: row.passkey_id });
      }
    });
  }
}
