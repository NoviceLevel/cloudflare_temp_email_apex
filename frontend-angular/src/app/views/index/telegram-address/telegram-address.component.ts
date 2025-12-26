import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { LoginComponent } from '../../common/login/login.component';

interface TelegramAddressRow {
  address: string;
  jwt: string;
}

@Component({
  selector: 'app-telegram-address',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatTableModule, MatButtonModule, MatDialogModule, TranslateModule, LoginComponent],
  template: `
    <div class="telegram-address">
      <mat-tab-group [(selectedIndex)]="selectedTab" color="primary" animationDuration="0ms">
        <mat-tab [label]="'address' | translate"></mat-tab>
        <mat-tab [label]="'bind' | translate"></mat-tab>
      </mat-tab-group>

      <div class="tab-content">
        @if (selectedTab === 0) {
          <div class="table-container">
            <table mat-table [dataSource]="data()" class="full-width">
              <ng-container matColumnDef="address">
                <th mat-header-cell *matHeaderCellDef>{{ 'address' | translate }}</th>
                <td mat-cell *matCellDef="let row">{{ row.address }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>{{ 'actions' | translate }}</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-button color="primary" (click)="confirmChange(row)">{{ 'switchEmailAddress' | translate }}</button>
                  <button mat-button color="warn" (click)="confirmUnbind(row)">{{ 'unbindEmailAddress' | translate }}</button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        } @else {
          <div class="login-container"><app-login></app-login></div>
        }
      </div>
    </div>
  `,
  styles: [`
    .telegram-address { padding: 16px 0; }
    .tab-content { padding: 16px 0; }
    .table-container { overflow: auto; }
    .full-width { width: 100%; }
    .login-container { margin-top: 16px; }
  `]
})
export class TelegramAddressComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  selectedTab = 0;
  displayedColumns = ['address', 'actions'];
  data = signal<TelegramAddressRow[]>([]);
  selectedRow = signal<TelegramAddressRow | null>(null);

  async ngOnInit() {
    if (this.state.telegramApp()?.initData && this.data().length === 0) {
      await this.fetchData();
    }
  }

  async fetchData() {
    try {
      const telegramApp = this.state.telegramApp();
      const results = await this.api.fetch('/telegram/get_bind_address', {
        method: 'POST',
        body: { initData: telegramApp.initData }
      });
      this.data.set(results || []);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  confirmChange(row: TelegramAddressRow) {
    this.selectedRow.set(row);
    const dialogRef = this.dialog.open(TelegramConfirmDialogComponent, {
      width: '320px',
      data: { message: this.translate.instant('switchEmailAddressConfirm'), confirmText: this.translate.instant('switchEmailAddress'), confirmColor: 'primary' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.changeAddress();
    });
  }

  confirmUnbind(row: TelegramAddressRow) {
    this.selectedRow.set(row);
    const dialogRef = this.dialog.open(TelegramConfirmDialogComponent, {
      width: '320px',
      data: { message: this.translate.instant('unbindEmailAddressConfirm'), confirmText: this.translate.instant('unbindEmailAddress'), confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.unbindAddress();
    });
  }

  changeAddress() {
    const row = this.selectedRow();
    if (row) {
      this.state.setJwt(row.jwt);
      location.reload();
    }
  }

  async unbindAddress() {
    try {
      const row = this.selectedRow();
      const telegramApp = this.state.telegramApp();
      if (row) {
        await this.api.fetch('/telegram/unbind_address', {
          method: 'POST',
          body: { initData: telegramApp.initData, address: row.address }
        });
        this.state.setJwt('');
        location.reload();
      }
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}

@Component({
  selector: 'app-telegram-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class TelegramConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}
