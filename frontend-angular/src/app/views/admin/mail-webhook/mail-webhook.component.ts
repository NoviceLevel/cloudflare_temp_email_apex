import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { WebhookComponent } from '../../../components/webhook/webhook.component';

@Component({
  selector: 'app-mail-webhook',
  standalone: true,
  imports: [CommonModule, WebhookComponent],
  template: `
    <app-webhook
      [fetchData]="fetchData"
      [saveSettingsFn]="saveSettings"
      [testSettingsFn]="testSettings">
    </app-webhook>
  `
})
export class MailWebhookComponent {
  private api = inject(ApiService);

  fetchData = async () => {
    return await this.api.fetch<any>('/admin/mail_webhook/settings');
  };

  saveSettings = async (settings: any) => {
    await this.api.fetch('/admin/mail_webhook/settings', {
      method: 'POST',
      body: settings
    });
  };

  testSettings = async (settings: any) => {
    await this.api.fetch('/admin/mail_webhook/test', {
      method: 'POST',
      body: settings
    });
  };
}
