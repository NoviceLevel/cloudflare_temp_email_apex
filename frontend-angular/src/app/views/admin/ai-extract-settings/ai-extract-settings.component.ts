import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-ai-extract-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule,
    MatSlideToggleModule, MatChipsModule, MatIconModule,
    MatFormFieldModule, MatInputModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>AI 邮件提取设置</mat-card-title>
          <span class="spacer"></span>
          <button mat-raised-button color="primary" (click)="saveSettings()">保存</button>
        </mat-card-header>
        <mat-card-content>
          <mat-slide-toggle [(ngModel)]="settings.enableAllowList" class="mb-3">
            启用地址白名单
          </mat-slide-toggle>

          @if (!settings.enableAllowList) {
            <div class="alert info mb-3">
              未启用时，所有邮箱地址都可使用 AI 提取功能
            </div>
          }

          @if (settings.enableAllowList) {
            <div class="alert warning mb-3">
              启用后，AI 提取功能仅对白名单中的邮箱地址生效
            </div>

            <mat-form-field appearance="outline" class="full-width mb-2">
              <mat-label>地址白名单</mat-label>
              <mat-chip-grid #chipGrid>
                @for (item of settings.allowList; track item) {
                  <mat-chip-row (removed)="removeItem(item)">
                    {{item}}
                    <button matChipRemove><mat-icon>cancel</mat-icon></button>
                  </mat-chip-row>
                }
              </mat-chip-grid>
              <input matInput [matChipInputFor]="chipGrid" [matChipInputSeparatorKeyCodes]="separatorKeyCodes"
                     (matChipInputTokenEnd)="addItem($event)"
                     placeholder="请输入地址并回车，支持通配符">
            </mat-form-field>

            <p class="hint">通配符 * 可匹配任意字符，如 *&#64;example.com 可匹配 example.com 域名下的所有地址</p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 600px; width: 100%; }
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .alert { padding: 12px 16px; border-radius: 4px; }
    .alert.warning { background-color: #fff3e0; color: #e65100; }
    .alert.info { background-color: #e3f2fd; color: #1976d2; }
    .hint { font-size: 12px; color: #666; }
    .spacer { flex: 1; }
    mat-card-header { display: flex; align-items: center; padding: 16px; }
  `]
})
export class AiExtractSettingsComponent implements OnInit {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);

  separatorKeyCodes = [ENTER, COMMA];
  settings = {
    enableAllowList: false,
    allowList: [] as string[]
  };

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/ai_extract/settings');
      Object.assign(this.settings, res);
    } catch (error: any) {
      this.snackbar.error(error.message || '获取设置失败');
    }
  }

  addItem(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) this.settings.allowList.push(value);
    event.chipInput!.clear();
  }

  removeItem(item: string) {
    const index = this.settings.allowList.indexOf(item);
    if (index >= 0) this.settings.allowList.splice(index, 1);
  }

  async saveSettings() {
    try {
      await this.api.fetch('/admin/ai_extract/settings', {
        method: 'POST',
        body: this.settings
      });
      this.snackbar.success('保存成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '保存失败');
    }
  }
}
