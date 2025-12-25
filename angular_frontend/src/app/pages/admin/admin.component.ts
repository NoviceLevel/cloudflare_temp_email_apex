import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StateService } from '../../services/state.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatTabsModule, MatButtonModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSnackBarModule,
  ],
  template: `
    <div class="admin-container">
      @if (!state.showAdminPage()) {
        <mat-card class="login-card">
          <mat-card-header>
            <mat-card-title>{{ t()('admin') }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ t()('adminPassword') }}</mat-label>
              <input matInput type="password" [(ngModel)]="password" (keyup.enter)="login()">
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-flat-button color="primary" (click)="login()">{{ t()('login') }}</button>
          </mat-card-actions>
        </mat-card>
      } @else {
        <mat-card>
          <mat-tab-group>
            <mat-tab>
              <ng-template mat-tab-label><mat-icon>people</mat-icon>{{ t()('account') }}</ng-template>
              <div class="tab-content"><p>Account management - Coming soon</p></div>
            </mat-tab>
            <mat-tab>
              <ng-template mat-tab-label><mat-icon>analytics</mat-icon>{{ t()('statistics') }}</ng-template>
              <div class="tab-content"><p>Statistics - Coming soon</p></div>
            </mat-tab>
            <mat-tab>
              <ng-template mat-tab-label><mat-icon>mail</mat-icon>{{ t()('mails') }}</ng-template>
              <div class="tab-content"><p>Mails management - Coming soon</p></div>
            </mat-tab>
            <mat-tab>
              <ng-template mat-tab-label><mat-icon>build</mat-icon>{{ t()('maintenance') }}</ng-template>
              <div class="tab-content"><p>Maintenance - Coming soon</p></div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 16px; }
    .login-card { max-width: 400px; margin: 100px auto; }
    .full-width { width: 100%; }
    .tab-content { padding: 16px; min-height: 400px; }
    mat-icon { margin-right: 8px; }
  `]
})
export class AdminComponent {
  state = inject(StateService);
  private i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);
  
  t = this.i18n.t;
  password = '';

  login() {
    if (this.password) {
      this.state.setAdminAuth(this.password);
      this.snackBar.open(this.t()('success'), 'OK', { duration: 2000 });
    }
  }
}
