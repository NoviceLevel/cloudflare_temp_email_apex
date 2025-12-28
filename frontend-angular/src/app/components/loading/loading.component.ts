import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.fullscreen]="fullscreen">
      <div class="loading-spinner">
        <svg viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
        </svg>
      </div>
      @if (text) {
        <div class="loading-text">{{ text }}</div>
      }
    </div>
  `,
  styles: [`
    .loading-container{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px;gap:16px}
    .loading-container.fullscreen{min-height:100vh;padding:0}
    .loading-spinner{width:48px;height:48px}
    .loading-spinner svg{width:100%;height:100%;animation:rotate 1.4s linear infinite}
    .loading-spinner circle{stroke:#1a73e8;stroke-linecap:round;animation:dash 1.4s ease-in-out infinite}
    :host-context(.dark) .loading-spinner circle{stroke:#8ab4f8}
    .loading-text{font-size:14px;color:#5f6368}
    :host-context(.dark) .loading-text{color:#9aa0a6}
    @keyframes rotate{100%{transform:rotate(360deg)}}
    @keyframes dash{0%{stroke-dasharray:1,150;stroke-dashoffset:0}50%{stroke-dasharray:90,150;stroke-dashoffset:-35}100%{stroke-dasharray:90,150;stroke-dashoffset:-124}}
  `]
})
export class LoadingComponent {
  @Input() text = '';
  @Input() fullscreen = false;
}
