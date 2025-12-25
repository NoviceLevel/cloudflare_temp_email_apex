import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

interface RoleConfig {
  role: string;
  max_address_count: number | null;
}

@Component({
  selector: 'app-admin-role-address-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="center">
      <mat-card appearance="outlined" class="config-card">
        <mat-card-content>
          <div class="alert-info mb-4">
            <mat-icon>info</mat-icon>
            <span>{{ 'roleConfigDesc' | translate }}</span>
          </div>

          @if (systemRoles().length === 0) {
            <div class="alert-warning">
              <mat-icon>warning</mat-icon>
              <span>{{ 'noRolesAvailable' | translate }}</span>
            </div>
          } @else {
            <div class="actions-row mb-4">
              <button mat-raised-button color="primary" (click)="saveConfig()" [disabled]="state.loading()">
                {{ 'save' | translate }}
              </button>
            </div>

            <table mat-table [dataSource]="tableData()" class="full-width">
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>{{ 'role' | translate }}</th>
                <td mat-cell *matCellDef="let row">
                  <mat-chip color="primary" highlighted>{{ row.role }}</mat-chip>
                </td>
              </ng-container>

              <ng-container matColumnDef="max_address_count">
                <th mat-header-cell *matHeaderCellDef>{{ 'maxAddressCount' | translate }}</th>
                <td mat-cell *matCellDef="let row">
                  <mat-form-field appearance="outline" class="count-field">
                    <input matInput type="number" [(ngModel)]="row.max_address_count"
                           [placeholder]="'notConfigured' | translate"
                           min="0" max="999">
                  </mat-form-field>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .center {
      display: flex;
      justify-content: center;
      margin-top: 16px;
    }
    .config-card {
      max-width: 600px;
      width: 100%;
    }
    .full-width {
      width: 100%;
    }
    .mb-4 {
      margin-bottom: 16px;
    }
    .actions-row {
      display: flex;
      justify-content: flex-end;
    }
    .count-field {
      max-width: 200px;
    }
    .alert-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 4px;
      color: #1565c0;
    }
    .alert-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fff3e0;
      border-radius: 4px;
      color: #e65100;
    }
    :host-context(.dark-theme) .alert-info {
      background: #0d47a1;
      color: #90caf9;
    }
    :host-context(.dark-theme) .alert-warning {
      background: #4a3000;
      color: #ffb74d;
    }
  `]
})
export class AdminRoleAddressConfigComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  systemRoles = signal<{ role: string }[]>([]);
  tableData = signal<RoleConfig[]>([]);
  displayedColumns = ['role', 'max_address_count'];

  async ngOnInit() {
    await this.fetchUserRoles();
    await this.fetchRoleConfigs();
  }

  async fetchUserRoles() {
    try {
      const results = await this.api.fetch<{ role: string }[]>('/admin/user_roles');
      this.systemRoles.set(results || []);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async fetchRoleConfigs() {
    try {
      const { configs } = await this.api.fetch<{ configs: Record<string, { maxAddressCount: number }> }>('/admin/role_address_config');
      const data = this.systemRoles().map(roleObj => ({
        role: roleObj.role,
        max_address_count: configs?.[roleObj.role]?.maxAddressCount ?? null
      }));
      this.tableData.set(data);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async saveConfig() {
    try {
      const configs: Record<string, { maxAddressCount: number }> = {};
      this.tableData().forEach(row => {
        if (row.max_address_count !== null && row.max_address_count !== undefined) {
          configs[row.role] = { maxAddressCount: row.max_address_count };
        }
      });
      await this.api.fetch('/admin/role_address_config', {
        method: 'POST',
        body: JSON.stringify({ configs })
      });
      this.snackbar.success(this.translate.instant('successTip'));
      await this.fetchRoleConfigs();
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}
