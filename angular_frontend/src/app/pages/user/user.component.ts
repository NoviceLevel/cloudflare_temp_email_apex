import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTabsModule, MatIconModule],
  template: `
    <div class="user-container">
      <mat-card>
        <mat-tab-group>
          <mat-tab>
            <ng-template mat-tab-label><mat-icon>login</mat-icon>{{ t()('login') }}</ng-template>
            <div class="tab-content"><p>User login - Coming soon</p></div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-container { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .tab-content { padding: 16px; min-height: 400px; }
    mat-icon { margin-right: 8px; }
  `]
})
export class UserComponent {
  private i18n = inject(I18nService);
  t = this.i18n.t;
}
