import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StateService } from '../../../services/state.service';
import { I18nService } from '../../../services/i18n.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { LoginComponent } from '../../../components/login/login.component';

@Component({
  selector: 'app-address-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    LoginComponent,
  ],
  template: `
    <mat-card class="address-bar">
      @if (!state.settings().fetched) {
        <div class="skeleton-loader">
          <div class="skeleton-line"></div>
        </div>
      } @else if (state.settings().address) {
        <div class="address-display">
          <mat-icon>email</mat-icon>
          <span class="address-text">{{ addressLabel() }}</span>
          <button mat-stroked-button color="primary" (click)="copyAddress()">
            <mat-icon>content_copy</mat-icon>
            {{ t()('copy') }}
          </button>
        </div>
      } @else {
        <div class="login-container">
          <app-login />
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .address-bar { margin-bottom: 16px; }
    .address-display { display: flex; align-items: center; gap: 12px; padding: 16px; flex-wrap: wrap; }
    .address-text { font-size: 18px; font-weight: 500; flex: 1; min-width: 200px; }
    .login-container { max-width: 600px; margin: 0 auto; padding: 16px; }
    .skeleton-loader { padding: 16px; }
    .skeleton-line { height: 20px; background: #f0f0f0; border-radius: 4px; }
  `]
})
export class AddressBarComponent {
  state = inject(StateService);
  private i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);
  private clipboard = inject(Clipboard);

  t = this.i18n.t;

  addressLabel() {
    const address = this.state.settings().address;
    if (!address) return '';
    return address;
  }

  copyAddress() {
    this.clipboard.copy(this.state.settings().address);
    this.snackBar.open(this.t()('copied'), 'OK', { duration: 2000 });
  }
}
