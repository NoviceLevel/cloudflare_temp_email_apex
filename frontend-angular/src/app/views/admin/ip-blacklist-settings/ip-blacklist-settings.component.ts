import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-ip-blacklist-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatInputModule, MatFormFieldModule, MatSlideToggleModule,
    MatChipsModule, MatIconModule, MatDividerModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>IP 黑名单设置</mat-card-title>
          <span class="spacer"></span>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">
            保存
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="alert info mb-3">
            <div><strong>作用范围：创建邮箱地址、发送邮件、外部发送邮件 API、用户注册、验证码验证</strong></div>
            <div>• IP 黑名单：支持文本匹配或正则表达式</div>
            <div>• ASN 组织：根据运营商/ISP 拉黑</div>
            <div>• 浏览器指纹：根据浏览器指纹拉黑</div>
            <div>• 每日限流：限制单个 IP 地址每天最多请求次数</div>
          </div>

          <div class="setting-row mb-3">
            <mat-slide-toggle [(ngModel)]="enabled">启用 IP 黑名单</mat-slide-toggle>
            <span class="hint">阻止匹配黑名单的 IP 访问限流 API</span>
          </div>

          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>IP 黑名单匹配模式</mat-label>
            <mat-chip-grid #chipGrid1>
              @for (item of ipBlacklist; track item) {
                <mat-chip-row (removed)="removeItem(ipBlacklist, item)" [disabled]="!enabled">
                  {{item}}
                  <button matChipRemove><mat-icon>cancel</mat-icon></button>
                </mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid1" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                   (matChipInputTokenEnd)="addItem(ipBlacklist, $event)" [disabled]="!enabled"
                   placeholder="输入匹配模式（例如：192.168.1）">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>ASN 组织（运营商）黑名单</mat-label>
            <mat-chip-grid #chipGrid2>
              @for (item of asnBlacklist; track item) {
                <mat-chip-row (removed)="removeItem(asnBlacklist, item)" [disabled]="!enabled">
                  {{item}}
                  <button matChipRemove><mat-icon>cancel</mat-icon></button>
                </mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid2" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                   (matChipInputTokenEnd)="addItem(asnBlacklist, $event)" [disabled]="!enabled"
                   placeholder="输入 ASN 组织名称">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>浏览器指纹黑名单</mat-label>
            <mat-chip-grid #chipGrid3>
              @for (item of fingerprintBlacklist; track item) {
                <mat-chip-row (removed)="removeItem(fingerprintBlacklist, item)" [disabled]="!enabled">
                  {{item}}
                  <button matChipRemove><mat-icon>cancel</mat-icon></button>
                </mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid3" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                   (matChipInputTokenEnd)="addItem(fingerprintBlacklist, $event)" [disabled]="!enabled"
                   placeholder="输入指纹 ID">
          </mat-form-field>

          <mat-divider class="mb-3"></mat-divider>

          <div class="setting-row mb-3">
            <mat-slide-toggle [(ngModel)]="enableDailyLimit">启用每日请求限流</mat-slide-toggle>
            <span class="hint">限制每个 IP 地址每天的 API 请求次数</span>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>每日请求次数上限</mat-label>
            <input matInput type="number" [(ngModel)]="dailyRequestLimit" [disabled]="!enableDailyLimit"
                   min="1" max="1000000" placeholder="输入限制次数（例如：1000）">
          </mat-form-field>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 600px; width: 100%; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
    .alert { padding: 12px 16px; border-radius: 4px; line-height: 1.8; }
    .alert.info { background-color: #e3f2fd; color: #1976d2; }
    .setting-row { display: flex; align-items: center; gap: 8px; }
    .hint { font-size: 12px; color: #666; }
    .spacer { flex: 1; }
    mat-card-header { display: flex; align-items: center; padding: 16px; }
  `]
})
export class IpBlacklistSettingsComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  separatorKeyCodes = [ENTER, COMMA];
  enabled = false;
  ipBlacklist: string[] = [];
  asnBlacklist: string[] = [];
  fingerprintBlacklist: string[] = [];
  enableDailyLimit = false;
  dailyRequestLimit = 1000;

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/ip_blacklist/settings');
      this.enabled = res.enabled || false;
      this.ipBlacklist = res.blacklist || [];
      this.asnBlacklist = res.asnBlacklist || [];
      this.fingerprintBlacklist = res.fingerprintBlacklist || [];
      this.enableDailyLimit = res.enableDailyLimit || false;
      this.dailyRequestLimit = res.dailyRequestLimit || 1000;
    } catch (error: any) {
      this.snackbar.error(error.message || '获取设置失败');
    }
  }

  addItem(list: string[], event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) list.push(value);
    event.chipInput!.clear();
  }

  removeItem(list: string[], item: string) {
    const index = list.indexOf(item);
    if (index >= 0) list.splice(index, 1);
  }

  async save() {
    try {
      await this.api.fetch('/admin/ip_blacklist/settings', {
        method: 'POST',
        body: {
          enabled: this.enabled,
          blacklist: this.ipBlacklist,
          asnBlacklist: this.asnBlacklist,
          fingerprintBlacklist: this.fingerprintBlacklist,
          enableDailyLimit: this.enableDailyLimit,
          dailyRequestLimit: this.dailyRequestLimit
        }
      });
      this.snackbar.success('保存成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '保存失败');
    }
  }
}
