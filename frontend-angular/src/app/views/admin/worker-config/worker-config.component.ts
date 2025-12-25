import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-worker-config',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-content>
          <pre class="config-box">{{ settings() | json }}</pre>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 800px; width: 100%; overflow: auto; }
    .config-box { background: #f5f5f5; padding: 16px; border-radius: 4px; overflow: auto; text-align: left; }
  `]
})
export class WorkerConfigComponent implements OnInit {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  settings = signal<any>({});

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/worker/configs');
      this.settings.set(res);
    } catch (error: any) {
      this.snackbar.error(error.message || '获取配置失败');
    }
  }
}
