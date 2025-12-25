import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { GlobalStateService } from '../../../services/global-state.service';
import { LoginComponent } from '../../common/login/login.component';

@Component({
  selector: 'app-bind-address',
  standalone: true,
  imports: [CommonModule, MatCardModule, LoginComponent],
  template: `
    @if (state.userSettings().user_email) {
      <div class="bind-address-container">
        <mat-card appearance="outlined">
          <mat-card-content>
            <app-login></app-login>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .bind-address-container {
      display: flex;
      justify-content: center;
    }
    mat-card {
      max-width: 600px;
      width: 100%;
    }
  `]
})
export class BindAddressComponent {
  state = inject(GlobalStateService);
}
