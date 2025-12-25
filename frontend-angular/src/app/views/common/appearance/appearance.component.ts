import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GlobalStateService } from '../../../services/global-state.service';

@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSliderModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="appearance-container">
      <mat-card appearance="outlined">
        <mat-card-content>
          <!-- 邮箱分栏大小 -->
          @if (!isMobile) {
            <div class="setting-item">
              <label class="setting-label">邮箱界面分栏大小</label>
              <mat-slider min="0.25" max="0.75" step="0.01" discrete>
                <input matSliderThumb [(ngModel)]="mailboxSplitSize" (ngModelChange)="savePreference('mailboxSplitSize', $event)">
              </mat-slider>
            </div>
          }

          <!-- 自动刷新间隔 -->
          <div class="setting-item">
            <label class="setting-label">自动刷新间隔(秒): {{ autoRefreshInterval }}</label>
            <mat-slider min="30" max="300" step="1" discrete>
              <input matSliderThumb [(ngModel)]="autoRefreshInterval" (ngModelChange)="savePreference('configAutoRefreshInterval', $event)">
            </mat-slider>
          </div>

          <!-- 使用极简主页 -->
          @if (showUseSimpleIndex) {
            <mat-slide-toggle [ngModel]="state.useSimpleIndex()" (ngModelChange)="toggleSimpleIndex($event)" color="primary" class="setting-toggle">
              使用极简主页
            </mat-slide-toggle>
          }

          <!-- 默认以文本显示邮件 -->
          <mat-slide-toggle [(ngModel)]="preferShowTextMail" (ngModelChange)="savePreference('preferShowTextMail', $event)" color="primary" class="setting-toggle">
            默认以文本显示邮件
          </mat-slide-toggle>

          <!-- 使用iframe显示HTML邮件 -->
          <mat-slide-toggle [(ngModel)]="useIframeShowMail" (ngModelChange)="savePreference('useIframeShowMail', $event)" color="primary" class="setting-toggle">
            使用iframe显示HTML邮件
          </mat-slide-toggle>

          <!-- 使用UTC时间 -->
          <mat-slide-toggle [(ngModel)]="useUTCDate" (ngModelChange)="savePreference('useUTCDate', $event)" color="primary" class="setting-toggle">
            使用 UTC 时间
          </mat-slide-toggle>

          <!-- 开启页面左右两侧侧边距 -->
          @if (!isMobile) {
            <mat-slide-toggle [(ngModel)]="useSideMargin" (ngModelChange)="savePreference('useSideMargin', $event)" color="primary" class="setting-toggle">
              开启页面左右两侧侧边距
            </mat-slide-toggle>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .appearance-container {
      display: flex;
      justify-content: center;
    }
    mat-card {
      max-width: 800px;
      width: 100%;
    }
    .setting-item {
      margin-bottom: 24px;
    }
    .setting-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    mat-slider {
      width: 100%;
    }
    .setting-toggle {
      display: block;
      margin-bottom: 16px;
    }
  `]
})
export class AppearanceComponent {
  @Input() showUseSimpleIndex = false;
  
  state = inject(GlobalStateService);
  
  // 从 GlobalStateService 读取设置
  mailboxSplitSize = this.state.mailboxSplitSize();
  useIframeShowMail = this.state.useIframeShowMail();
  preferShowTextMail = this.state.preferShowTextMail();
  autoRefreshInterval = this.state.configAutoRefreshInterval();
  useSideMargin = this.state.useSideMargin();
  useUTCDate = this.state.useUTCDate();
  
  isMobile = window.innerWidth < 768;

  savePreference(key: string, value: any) {
    this.state.savePreference(key, value);
  }

  toggleSimpleIndex(value: boolean) {
    this.state.useSimpleIndex.set(value);
    localStorage.setItem('useSimpleIndex', value.toString());
  }
}
