import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-user-oauth2-callback',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="center">
      <mat-card appearance="outlined" class="callback-card">
        <mat-card-content class="text-center">
          <mat-spinner diameter="40" class="mb-4 spinner"></mat-spinner>
          <div class="logging-text">{{ 'logging' | translate }}</div>
          @if (errorInfo()) {
            <div class="error-text mt-2">{{ errorInfo() }}</div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .center {
      display: flex;
      justify-content: center;
    }
    .callback-card {
      max-width: 600px;
      width: 100%;
    }
    .text-center {
      text-align: center;
    }
    .mb-4 {
      margin-bottom: 16px;
    }
    .mt-2 {
      margin-top: 8px;
    }
    .spinner {
      margin: 0 auto;
    }
    .logging-text {
      font-size: 1.25rem;
    }
    .error-text {
      color: #f44336;
    }
  `]
})
export class UserOauth2CallbackComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  errorInfo = signal('');

  async ngOnInit() {
    const state = this.route.snapshot.queryParamMap.get('state');
    const sessionState = this.state.userOauth2SessionState();

    if (state !== sessionState) {
      console.error('state not match');
      this.snackbar.error(this.translate.instant('stateNotMatch'));
      this.errorInfo.set(this.translate.instant('stateNotMatch'));
      return;
    }

    const code = this.route.snapshot.queryParamMap.get('code');
    if (!code) {
      console.error('code not found');
      this.snackbar.error('code not found');
      this.errorInfo.set('code not found');
      return;
    }

    try {
      const res = await this.api.fetch<{ jwt: string }>('/user_api/oauth2/callback', {
        method: 'POST',
        body: JSON.stringify({
          code: code,
          clientID: this.state.userOauth2SessionClientID()
        })
      });
      this.state.userJwt.set(res.jwt);
      this.router.navigate(['/user']);
    } catch (error: any) {
      console.error(error);
      this.snackbar.error(error.message || 'error');
      this.errorInfo.set(error.message || 'error');
    }
  }
}
