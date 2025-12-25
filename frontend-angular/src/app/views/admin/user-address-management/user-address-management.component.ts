import { Component, inject, OnInit, signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

interface AddressData {
  name: string;
  mail_count: number;
  send_count: number;
}

@Component({
  selector: 'app-admin-user-address-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    TranslateModule,
  ],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="data()" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>{{ 'name' | translate }}</th>
          <td mat-cell *matCellDef="let row">{{ row.name }}</td>
        </ng-container>

        <ng-container matColumnDef="mail_count">
          <th mat-header-cell *matHeaderCellDef>{{ 'mail_count' | translate }}</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip color="primary" highlighted>{{ row.mail_count }}</mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="send_count">
          <th mat-header-cell *matHeaderCellDef>{{ 'send_count' | translate }}</th>
          <td mat-cell *matCellDef="let row">
            <mat-chip color="primary" highlighted>{{ row.send_count }}</mat-chip>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .table-container {
      overflow: auto;
    }
    .full-width {
      width: 100%;
      min-width: 500px;
    }
  `]
})
export class AdminUserAddressManagementComponent implements OnInit {
  @Input() userId!: number;

  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  data = signal<AddressData[]>([]);
  displayedColumns = ['name', 'mail_count', 'send_count'];

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const { results } = await this.api.fetch<{ results: AddressData[] }>(
        `/admin/users/bind_address/${this.userId}`
      );
      this.data.set(results || []);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }
}
