import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WebhookComponent as WebhookBaseComponent } from '../../../components/webhook/webhook.component';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-index-webhook',
  standalone: true,
  imports: [CommonModule, WebhookBaseComponent],
  template: `
    <app-webhook
      [fetchData]="fetchData"
      [saveSettingsFn]="saveSettings"
      [testSettingsFn]="testSettings">
    </app-webhook>
  `,
})
export class IndexWebhookComponent {
  private api = inject(ApiService);

  fetchData = async () => {
    return await this.api.fetch('/api/webhook/settings');
  };

  saveSettings = async (webhookSettings: any) => {
    await this.api.fetch('/api/webhook/settings', {
      method: 'POST',
      body: webhookSettings,
    });
  };

  testSettings = async (webhookSettings: any) => {
    await this.api.fetch('/api/webhook/test', {
      method: 'POST',
      body: webhookSettings,
    });
  };
}
