import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer>
      <span>© {{ year }} {{ state.openSettings().copyright || 'NoviceLevel' }}</span>
      @if (state.openSettings().showGithub) {
        <a href="https://github.com/dreamhunter2333/cloudflare_temp_email" target="_blank" rel="noopener">
          GitHub
        </a>
      }
    </footer>
  `,
  styles: [`
    footer {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 8px 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
      
      a {
        color: var(--mat-sys-primary);
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class FooterComponent {
  state = inject(StateService);
  year = new Date().getFullYear();
}
