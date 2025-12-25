import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatSlideToggleModule, MatExpansionModule, MatDialogModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-content>
          @if (state.openSettings().prefix) {
            <mat-slide-toggle [(ngModel)]="enablePrefix" class="mb-3">是否启用前缀</mat-slide-toggle>
          }
          <div class="email-row">
            @if (enablePrefix && state.openSettings().prefix) {
              <span class="prefix">{{ state.openSettings().prefix }}</span>
            }
            <mat-form-field appearance="outline" class="flex-grow">
              <mat-label>邮箱名称</mat-label>
              <input matInput [(ngModel)]="emailName">
            </mat-form-field>
            <span class="at">&#64;</span>
            <mat-form-field appearance="outline" class="domain-field">
              <mat-label>域名</mat-label>
              <mat-select [(ngModel)]="emailDomain">
                @for (domain of domainOptions(); track domain.value) {
                  <mat-option [value]="domain.value">{{ domain.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
          <button mat-raised-button color="primary" class="full-width" (click)="createEmail()" [disabled]="state.loading()">创建新邮箱</button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 600px; width: 100%; }
    .email-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .prefix { background: #e3f2fd; padding: 8px 12px; border-radius: 4px; }
    .flex-grow { flex: 1; min-width: 120px; }
    .at { font-weight: bold; font-size: 18px; }
    .domain-field { min-width: 150px; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
  `]
})
export class CreateAccountComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  enablePrefix = true;
  emailName = '';
  emailDomain = '';
  domainOptions = signal<{label: string; value: string}[]>([]);

  ngOnInit() {
    const domains = this.state.openSettings().domains || [];
    this.domainOptions.set(domains);
    if (domains.length > 0) {
      this.emailDomain = domains[0].value;
    }
  }

  async createEmail() {
    if (!this.emailName || !this.emailDomain) {
      this.snackbar.error('请填写完整信息');
      return;
    }
    try {
      const res = await this.api.fetch<any>('/admin/new_address', {
        method: 'POST',
        body: { enablePrefix: this.enablePrefix, name: this.emailName, domain: this.emailDomain }
      });
      this.snackbar.success('创建成功');
      this.dialog.open(CredentialDialogComponent, {
        width: '600px',
        data: { jwt: res.jwt, password: res.password || '', address: res.address || '' }
      });
    } catch (error: any) {
      this.snackbar.error(error.message || '创建失败');
    }
  }
}

// Credential Dialog
@Component({
  selector: 'app-credential-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatExpansionModule],
  template: `
    <h2 mat-dialog-title>邮箱地址凭证</h2>
    <mat-dialog-content>
      <p class="mb-3">请复制邮箱地址凭证，你可以使用它登录你的邮箱。</p>
      <div class="credential-box mb-3"><strong>{{ data.jwt }}</strong></div>
      @if (data.password) {
        <div class="credential-box mb-3">
          <p><strong>{{ data.address }}</strong></p>
          <p>地址密码: <strong>{{ data.password }}</strong></p>
        </div>
      }
      <mat-expansion-panel>
        <mat-expansion-panel-header><mat-panel-title>打开即可自动登录邮箱的链接</mat-panel-title></mat-expansion-panel-header>
        <div class="credential-box"><strong>{{ getUrlWithJwt() }}</strong></div>
      </mat-expansion-panel>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>关闭</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .mb-3 { margin-bottom: 12px; }
    .credential-box { background: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all; font-family: monospace; }
  `]
})
export class CredentialDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  getUrlWithJwt(): string {
    return `${window.location.origin}/?jwt=${this.data.jwt}`;
  }
}
