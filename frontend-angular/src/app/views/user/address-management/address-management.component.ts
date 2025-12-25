import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { LoginComponent } from '../../common/login/login.component';

interface AddressRow {
  id: number;
  name: string;
  mail_count: number;
  send_count: number;
}

@Component({
  selector: 'app-address-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule, MatTableModule, MatButtonModule,
    MatChipsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatDialogModule, LoginComponent
  ],
  template: `
    <div class="address-management">
      <mat-tab-group [(selectedIndex)]="selectedTab" color="primary" animationDuration="0ms">
        <mat-tab label="地址"></mat-tab>
        <mat-tab label="创建或绑定"></mat-tab>
      </mat-tab-group>

      <div class="tab-content">
        @if (selectedTab === 0) {
          <div class="table-container">
            <table mat-table [dataSource]="data()" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>名称</th>
                <td mat-cell *matCellDef="let row">{{ row.name }}</td>
              </ng-container>
              <ng-container matColumnDef="mail_count">
                <th mat-header-cell *matHeaderCellDef>邮件数量</th>
                <td mat-cell *matCellDef="let row"><mat-chip color="primary" highlighted>{{ row.mail_count }}</mat-chip></td>
              </ng-container>
              <ng-container matColumnDef="send_count">
                <th mat-header-cell *matHeaderCellDef>发送数量</th>
                <td mat-cell *matCellDef="let row"><mat-chip color="primary" highlighted>{{ row.send_count }}</mat-chip></td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-button color="primary" (click)="confirmChange(row)">切换地址</button>
                  <button mat-button color="primary" (click)="openTransferDialog(row)">转移地址</button>
                  <button mat-button color="warn" (click)="confirmUnbind(row)">解绑地址</button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        } @else {
          <div class="login-container">
            <mat-card appearance="outlined">
              <mat-card-content><app-login></app-login></mat-card-content>
            </mat-card>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .address-management { padding: 16px 0; }
    .tab-content { padding: 16px 0; }
    .table-container { overflow: auto; }
    .full-width { width: 100%; }
    .login-container { display: flex; justify-content: center; }
    .login-container mat-card { max-width: 600px; width: 100%; }
  `]
})
export class AddressManagementComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  selectedTab = 0;
  displayedColumns = ['name', 'mail_count', 'send_count', 'actions'];
  data = signal<AddressRow[]>([]);
  currentAddress = signal('');
  currentAddressId = signal(0);

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const { results } = await this.api.getBindAddressList();
      this.data.set(results || []);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  confirmChange(row: AddressRow) {
    this.currentAddressId.set(row.id);
    const dialogRef = this.dialog.open(AddressConfirmDialogComponent, {
      width: '320px',
      data: { message: '切换地址?', confirmText: '切换地址', confirmColor: 'primary' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.changeMailAddress(); });
  }

  confirmUnbind(row: AddressRow) {
    this.currentAddressId.set(row.id);
    const dialogRef = this.dialog.open(AddressConfirmDialogComponent, {
      width: '360px',
      data: { message: '解绑前请切换到此邮箱地址并保存邮箱地址凭证。', confirmText: '解绑地址', confirmColor: 'warn' }
    });
    dialogRef.afterClosed().subscribe(result => { if (result) this.unbindAddress(); });
  }

  openTransferDialog(row: AddressRow) {
    this.currentAddressId.set(row.id);
    this.currentAddress.set(row.name);
    const dialogRef = this.dialog.open(TransferAddressDialogComponent, {
      width: '450px',
      data: { address: row.name }
    });
    dialogRef.afterClosed().subscribe(async (targetEmail) => {
      if (targetEmail) {
        await this.transferAddress(targetEmail);
      }
    });
  }

  async changeMailAddress() {
    try {
      const res = await this.api.getBindAddressJwt(this.currentAddressId());
      this.snackbar.success('切换地址 成功');
      if (!res.jwt) {
        this.snackbar.error('jwt not found');
        return;
      }
      this.state.setJwt(res.jwt);
      await this.router.navigate(['/']);
      location.reload();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async unbindAddress() {
    try {
      await this.api.unbindAddress(this.currentAddressId());
      this.snackbar.success('解绑地址 成功');
      await this.fetchData();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async transferAddress(targetUserEmail: string) {
    try {
      await this.api.transferAddress(this.currentAddressId(), targetUserEmail);
      this.snackbar.success('转移地址 成功');
      await this.fetchData();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}

// Confirm Dialog
@Component({
  selector: 'app-address-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">{{ data.confirmText }}</button>
    </mat-dialog-actions>
  `
})
export class AddressConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}

// Transfer Address Dialog
@Component({
  selector: 'app-transfer-address-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>转移地址</h2>
    <mat-dialog-content>
      <p class="mb-2">转移地址到其他用户将会从你的账户中移除此地址并转移给其他用户。确定要转移地址吗？</p>
      <p class="mb-3">转移地址: {{ data.address }}</p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>目标用户邮箱</mat-label>
        <input matInput [(ngModel)]="targetUserEmail">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="targetUserEmail" [disabled]="!targetUserEmail">转移地址</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; } .mb-2 { margin-bottom: 8px; } .mb-3 { margin-bottom: 12px; }`]
})
export class TransferAddressDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  targetUserEmail = '';
}
