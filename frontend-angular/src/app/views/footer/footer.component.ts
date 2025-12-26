import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { GlobalStateService } from '../../services/global-state.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <span>{{ 'copyright' | translate }} © 2023-{{ currentYear }}</span>
        <span [innerHTML]="state.openSettings().copyright"></span>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      border-top: 1px solid var(--mat-sys-outline-variant, #ccc);
      padding: 14px 0;
      font-size: 14px;
      text-align: center;
    }
    .footer-content {
      display: flex;
      justify-content: center;
      gap: 8px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
  `]
})
export class FooterComponent {
  state = inject(GlobalStateService);
  currentYear = new Date().getFullYear();
}
