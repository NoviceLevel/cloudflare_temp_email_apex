import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatSlideToggleModule, MatExpansionModule, MatDialogModule, MatIconModule, TranslateModule
  ],
  template: `
    <div class="create-page">
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">创建新邮箱</h3>
        </div>
        <div class="admin-card-body">
          @if (state.openSettings().prefix) {
            <div class="setting-item mb-4">
              <div class="setting-info">
                <div class="setting-title">使用前缀</div>
                <div class="setting-desc">前缀: {{ state.openSettings().prefix }}</div>
              </div>
              <mat-slide-toggle [(ngModel)]="enablePrefix"></mat-slide-toggle>
            </div>
          }

          <div class="form-group">
            <label class="form-label">邮箱地址</label>
            <div class="email-input-row">
              @if (enablePrefix && state.openSettings().prefix) {
                <span class="prefix-badge">{{ state.openSettings().prefix }}</span>
              }
              <mat-form-field appearance="outline" class="name-field">
                <input matInput [(ngModel)]="emailName" placeholder="用户名">
              </mat-form-field>
              <span class="at-symbol">&#64;</span>
              <mat-form-field appearance="outline" class="domain-field">
                <mat-select [(ngModel)]="emailDomain">
                  @for (domain of domainOptions(); track domain.value) {
                    <mat-option [value]="domain.value">{{ domain.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <div class="form-actions">
            <button mat-raised-button color="primary" (click)="createEmail()" [disabled]="state.loading()">
              <mat-icon>add</mat-icon>
              创建邮箱
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .create-page { max-width: 600px; }
    .setting-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #e0e0e0; }
    :host-context(.dark) .setting-item { border-color: #3c4043; }
    .setting-info { flex: 1; }
    .setting-title { font-size: 14px; font-weight: 500; color: #202124; }
    :host-context(.dark) .setting-title { color: #e8eaed; }
    .setting-desc { font-size: 12px; color: #5f6368; margin-top: 2px; }
    :host-context(.dark) .setting-desc { color: #9aa0a6; }
    .email-input-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .prefix-badge { background: #e8f0fe; color: #1a73e8; padding: 8px 12px; border-radius: 4px; font-weight: 500; }
    :host-context(.dark) .prefix-badge { background: #174ea6; color: #8ab4f8; }
    .name-field { flex: 1; min-width: 120px; }
    .at-symbol { font-size: 18px; font-weight: 500; color: #5f6368; }
    .domain-field { min-width: 160px; }
    .name-field ::ng-deep .mat-mdc-form-field-subscript-wrapper,
    .domain-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
  `]
})
export class CreateAccountComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  enablePrefix = true;
  emailName = '';
  emailDomain = '';
  domainOptions = signal<{label: string; value: string}[]>([]);

  ngOnInit() {
    const domains = this.state.openSettings().domains || [];
    this.domainOptions.set(domains);
    if (domains.length > 0) this.emailDomain = domains[0].value;
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
      this.emailName = '';
    } catch (error: any) {
      this.snackbar.error(error.message || '创建失败');
    }
  }
}

@Component({
  selector: 'app-credential-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatExpansionModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>邮箱凭证</h2>
    <mat-dialog-content>
      <div class="admin-alert info mb-3">
        <mat-icon>info</mat-icon>
        <span>请妥善保管以下凭证信息，关闭后将无法再次查看</span>
      </div>
      
      <div class="credential-section">
        <div class="credential-label">JWT 凭证</div>
        <div class="credential-box">
          <code>{{ data.jwt }}</code>
          <button mat-icon-button (click)="copy(data.jwt)"><mat-icon>content_copy</mat-icon></button>
        </div>
      </div>

      @if (data.password) {
        <div class="credential-section">
          <div class="credential-label">账号信息</div>
          <div class="credential-box">
            <div><strong>地址:</strong> {{ data.address }}</div>
            <div><strong>密码:</strong> {{ data.password }}</div>
          </div>
        </div>
      }

      <mat-expansion-panel class="mt-3">
        <mat-expansion-panel-header>
          <mat-panel-title>带凭证的访问链接</mat-panel-title>
        </mat-expansion-panel-header>
        <div class="credential-box">
          <code>{{ getUrlWithJwt() }}</code>
          <button mat-icon-button (click)="copy(getUrlWithJwt())"><mat-icon>content_copy</mat-icon></button>
        </div>
      </mat-expansion-panel>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>关闭</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .admin-alert { padding: 12px 16px; border-radius: 4px; font-size: 14px; display: flex; align-items: flex-start; gap: 12px; }
    .admin-alert mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .admin-alert.info { background: #e8f0fe; color: #1967d2; }
    .mb-3 { margin-bottom: 16px; }
    .mt-3 { margin-top: 16px; }
    .credential-section { margin-bottom: 16px; }
    .credential-label { font-size: 12px; font-weight: 500; color: #5f6368; margin-bottom: 8px; text-transform: uppercase; }
    .credential-box { background: #f8f9fa; padding: 12px 16px; border-radius: 8px; font-size: 13px; word-break: break-all; display: flex; align-items: flex-start; gap: 8px; }
    .credential-box code { flex: 1; font-family: monospace; }
  `]
})
export class CredentialDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  getUrlWithJwt(): string { return `${window.location.origin}/?jwt=${this.data.jwt}`; }
  copy(text: string) { navigator.clipboard.writeText(text); }
}
