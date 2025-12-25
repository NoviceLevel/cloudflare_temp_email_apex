import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { LoginComponent } from '../../common/login/login.component';

interface LocalAddressRow {
  valid: boolean;
  address: string;
  jwt: string;
}

@Component({
  selector: 'app-local-address',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    LoginComponent,
  ],
  template: `
    <div class="local-address">
      <div class="warning-alert mb-3">
        这些地址存储在您的浏览器中，如果您清除浏览器缓存，可能会丢失。
      </div>

      <mat-tab-group [(selectedIndex)]="selectedTab" color="primary" animationDuration="0ms">
        <mat-tab label="地址"></mat-tab>
        <mat-tab label="创建或绑定"></mat-tab>
      </mat-tab-group>

      <div class="tab-content">
        @if (selectedTab === 0) {
          <div class="table-container">
            <table mat-table [dataSource]="data()" class="full-width">
              <ng-container matColumnDef="address">
                <th mat-header-cell *matHeaderCellDef>地址</th>
                <td mat-cell *matCellDef="let row">{{ row.address }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>操作</th>
                <td mat-cell *matCellDef="let row">
                  <button mat-button color="primary" (click)="confirmChange(row)">切换邮箱地址</button>
                  <button mat-button color="warn" [disabled]="state.jwt() === row.jwt" (click)="confirmUnbind(row)">
                    解绑邮箱地址
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
        } @else {
          <div class="login-container">
            <app-login></app-login>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .local-address { padding: 16px 0; }
    .warning-alert {
      display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background-color: #fff3e0; border-radius: 4px; color: #e65100;
    }
    .tab-content { padding: 16px 0; }
    .table-container { overflow: auto; }
    .full-width { width: 100%; }
    .login-container { margin-top: 16px; }
    .mb-3 { margin-bottom: 12px; }
    :host-context(.dark-theme) .warning-alert { background-color: #4a3000; color: #ffb74d; }
  `]
})
export class LocalAddressComponent implements OnInit {
  state = inject(GlobalStateService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  selectedTab = 0;
  displayedColumns = ['address', 'actions'];
  selectedRow = signal<LocalAddressRow | null>(null);

  private localAddressCache = signal<string[]>(
    JSON.parse(localStorage.getItem('LocalAddressCache') || '[]')
  );

  data = computed(() => {
    const currentJwt = this.state.jwt();
    const cache = this.localAddressCache();
    if (currentJwt && !cache.includes(currentJwt)) {
      const newCache = [...cache, currentJwt];
      this.localAddressCache.set(newCache);
      localStorage.setItem('LocalAddressCache', JSON.stringify(newCache));
    }
    return this.localAddressCache().map(jwt => {
      try {
        const payload = JSON.parse(decodeURIComponent(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))));
        return { valid: true, address: payload.address, jwt };
      } catch (e) {
        return { valid: false, address: `invalid jwt [${jwt}]`, jwt };
      }
    });
  });

  ngOnInit() {
    const currentJwt = this.state.jwt();
    if (currentJwt) {
      const cache = this.localAddressCache();
      if (!cache.includes(currentJwt)) {
        const newCache = [...cache, currentJwt];
        this.localAddressCache.set(newCache);
        localStorage.setItem('LocalAddressCache', JSON.stringify(newCache));
      }
    }
  }

  confirmChange(row: LocalAddressRow) {
    this.selectedRow.set(row);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '320px',
      data: { title: '切换邮箱地址', message: '切换邮箱地址?', confirmText: '切换邮箱地址', confirmColor: 'primary' }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.changeAddress();
    });
  }

  confirmUnbind(row: LocalAddressRow) {
    this.selectedRow.set(row);
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '320px',
      data: { title: '解绑邮箱地址', message: '解绑邮箱地址?', confirmText: '解绑邮箱地址', confirmColor: 'warn' }
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

  unbindAddress() {
    const row = this.selectedRow();
    if (row && this.state.jwt() !== row.jwt) {
      const newCache = this.localAddressCache().filter(jwt => jwt !== row.jwt);
      this.localAddressCache.set(newCache);
      localStorage.setItem('LocalAddressCache', JSON.stringify(newCache));
    }
  }

  bindAddress() {
    const currentJwt = this.state.jwt();
    if (currentJwt) {
      const cache = this.localAddressCache();
      if (!cache.includes(currentJwt)) {
        const newCache = [...cache, currentJwt];
        this.localAddressCache.set(newCache);
        localStorage.setItem('LocalAddressCache', JSON.stringify(newCache));
      }
      this.selectedTab = 0;
      this.snackbar.success('绑定地址成功');
    }
  }
}

// Confirm Dialog Component
@Component({
  selector: 'app-confirm-dialog',
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
export class ConfirmDialogComponent {
  data = inject(MAT_DIALOG_DATA);
}
