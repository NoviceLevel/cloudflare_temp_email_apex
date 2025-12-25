import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (state.openSettings().adminContact) {
      <div class="admin-contact-alert">
        <mat-icon>info</mat-icon>
        <span>如果你需要帮助，请联系管理员 ({{ state.openSettings().adminContact }})</span>
      </div>
    }
  `,
  styles: [`
    .admin-contact-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
    }
    :host-context(.dark-theme) .admin-contact-alert {
      background-color: #1e3a5f;
      color: #90caf9;
    }
  `]
})
export class AdminContactComponent {
  state = inject(GlobalStateService);
}
