import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SendboxComponent as SendboxListComponent } from '../../../components/sendbox/sendbox.component';

@Component({
  selector: 'app-admin-sendbox',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, TranslateModule, SendboxListComponent],
  template: `
    <div class="container">
      <div class="search-row mb-3">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>{{ 'enterAddressQuery' | translate }}</mat-label>
          <input matInput [(ngModel)]="addressQuery" (keydown.enter)="refresh()">
        </mat-form-field>
        <button mat-stroked-button color="primary" (click)="refresh()">{{ 'query' | translate }}</button>
      </div>
      
      <app-sendbox
        [enableUserDeleteEmail]="true"
        [deleteMailFn]="deleteMail"
        [fetchMailData]="fetchData"
        [showEMailFrom]="true">
      </app-sendbox>
    </div>
  `,
  styles: [`
    .container { padding: 16px; }
    .search-row { display: flex; gap: 8px; align-items: center; }
    .search-field { max-width: 400px; flex: 1; }
    .mb-3 { margin-bottom: 12px; }
  `]
})
export class AdminSendboxComponent {
  state = inject(GlobalStateService);
  private api = inject(ApiService);

  addressQuery = '';

  fetchData = async (limit: number, offset: number) => {
    const query = this.addressQuery.trim();
    let url = `/admin/sendbox?limit=${limit}&offset=${offset}`;
    if (query) url += `&address=${encodeURIComponent(query)}`;
    return await this.api.fetch<any>(url);
  };

  deleteMail = async (mailId: number) => {
    await this.api.fetch(`/admin/sendbox/${mailId}`, { method: 'DELETE' });
  };

  refresh() {
    // Trigger re-fetch by updating the component
    this.state.adminSendBoxTabAddress.set(this.addressQuery);
  }
}
