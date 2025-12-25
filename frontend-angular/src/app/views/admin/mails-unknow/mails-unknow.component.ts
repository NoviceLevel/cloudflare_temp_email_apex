import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { MailboxComponent } from '../../../components/mailbox/mailbox.component';

@Component({
  selector: 'app-mails-unknow',
  standalone: true,
  imports: [CommonModule, MailboxComponent],
  template: `
    <div class="container">
      <app-mailbox
        [enableUserDeleteEmail]="true"
        [fetchMailData]="fetchMailData"
        [deleteMail]="deleteMail">
      </app-mailbox>
    </div>
  `,
  styles: [`
    .container { padding: 16px; }
  `]
})
export class MailsUnknowComponent {
  private api = inject(ApiService);

  fetchMailData = async (limit: number, offset: number) => {
    return await this.api.fetch<any>(`/admin/mails_unknow?limit=${limit}&offset=${offset}`);
  };

  deleteMail = async (mailId: number) => {
    await this.api.fetch(`/admin/mails/${mailId}`, { method: 'DELETE' });
  };
}
