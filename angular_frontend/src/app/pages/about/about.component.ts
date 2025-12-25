import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="about-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ t()('about') }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>Cloudflare Temp Email - A temporary email service powered by Cloudflare Workers.</p>
          <p>Built with Angular + Angular Material (M3)</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .about-container { max-width: 800px; margin: 0 auto; padding: 16px; }
  `]
})
export class AboutComponent {
  private i18n = inject(I18nService);
  t = this.i18n.t;
}
