import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { GlobalStateService } from '../../services/global-state.service';
import { ApiService } from '../../services/api.service';
import { AddressBarComponent } from '../../components/address-bar/address-bar.component';
import { MailboxComponent } from '../../components/mailbox/mailbox.component';
import { SendboxComponent } from '../../components/sendbox/sendbox.component';
import { SendMailComponent } from '../../views/index/send-mail/send-mail.component';
import { AccountSettingsComponent } from '../../views/index/account-settings/account-settings.component';
import { AppearanceComponent } from '../../views/common/appearance/appearance.component';
import { AutoReplyComponent } from '../../views/index/auto-reply/auto-reply.component';
import { IndexWebhookComponent } from '../../views/index/webhook/webhook.component';
import { AttachmentComponent } from '../../views/index/attachment/attachment.component';
import { AboutComponent } from '../../views/common/about/about.component';
import { SimpleIndexComponent } from '../../views/index/simple-index/simple-index.component';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    AddressBarComponent,
    MailboxComponent,
    SendboxComponent,
    SendMailComponent,
    AccountSettingsComponent,
    AppearanceComponent,
    AutoReplyComponent,
    IndexWebhookComponent,
    AttachmentComponent,
    AboutComponent,
    SimpleIndexComponent,
  ],
  template: `
    @if (state.useSimpleIndex()) {
      <app-simple-index></app-simple-index>
    } @else {
      <div class="container">
        <app-address-bar></app-address-bar>

        @if (state.settings().address) {
          <mat-card class="main-card">
            <mat-tab-group [(selectedIndex)]="selectedTab" (selectedIndexChange)="onTabChange($event)" color="primary" animationDuration="0ms">
              <!-- 收件箱 -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>inbox</mat-icon>
                  <span class="tab-label">收件箱</span>
                </ng-template>
                <div class="tab-content">
                  <app-mailbox 
                    [enableUserDeleteEmail]="state.openSettings().enableUserDeleteEmail"
                    [showReply]="true"
                    [showFilterInput]="true">
                  </app-mailbox>
                </div>
              </mat-tab>

              <!-- 发件箱 -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>send</mat-icon>
                  <span class="tab-label">发件箱</span>
                </ng-template>
                <div class="tab-content">
                  <app-sendbox
                    [enableUserDeleteEmail]="state.openSettings().enableUserDeleteEmail"
                    [showEMailFrom]="false"
                    [fetchMailData]="fetchSendboxData"
                    [deleteMailFn]="deleteSendboxMail">
                  </app-sendbox>
                </div>
              </mat-tab>

              <!-- 发送邮件 -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>edit</mat-icon>
                  <span class="tab-label">发送邮件</span>
                </ng-template>
                <div class="tab-content">
                  <app-send-mail></app-send-mail>
                </div>
              </mat-tab>

              <!-- 账户设置 -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>settings</mat-icon>
                  <span class="tab-label">账户</span>
                </ng-template>
                <div class="tab-content">
                  <app-account-settings></app-account-settings>
                </div>
              </mat-tab>

              <!-- 外观 -->
              <mat-tab>
                <ng-template mat-tab-label>
                  <mat-icon>palette</mat-icon>
                  <span class="tab-label">外观</span>
                </ng-template>
                <div class="tab-content">
                  <app-appearance [showUseSimpleIndex]="true"></app-appearance>
                </div>
              </mat-tab>

              <!-- 自动回复 -->
              @if (state.openSettings().enableAutoReply) {
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon>reply_all</mat-icon>
                    <span class="tab-label">自动回复</span>
                  </ng-template>
                  <div class="tab-content">
                    <app-auto-reply></app-auto-reply>
                  </div>
                </mat-tab>
              }

              <!-- Webhook -->
              @if (state.openSettings().enableWebhook) {
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon>webhook</mat-icon>
                    <span class="tab-label">Webhook</span>
                  </ng-template>
                  <div class="tab-content">
                    <app-index-webhook></app-index-webhook>
                  </div>
                </mat-tab>
              }

              <!-- S3 附件 -->
              @if (state.openSettings().isS3Enabled) {
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon>attachment</mat-icon>
                    <span class="tab-label">S3附件</span>
                  </ng-template>
                  <div class="tab-content">
                    <app-attachment></app-attachment>
                  </div>
                </mat-tab>
              }

              <!-- 关于 -->
              @if (state.openSettings().enableIndexAbout) {
                <mat-tab>
                  <ng-template mat-tab-label>
                    <mat-icon>info</mat-icon>
                    <span class="tab-label">关于</span>
                  </ng-template>
                  <div class="tab-content">
                    <app-about></app-about>
                  </div>
                </mat-tab>
              }
            </mat-tab-group>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 24px auto;
      padding: 0 16px;
    }
    .main-card {
      margin-top: 16px;
    }
    .tab-content {
      padding: 16px;
      min-height: 400px;
    }
    mat-tab-group {
      min-height: 500px;
    }
    .tab-label {
      margin-left: 8px;
    }
    @media (max-width: 768px) {
      .tab-label {
        display: none;
      }
    }
  `]
})
export class IndexComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  
  selectedTab = 0;

  // Tab name to index mapping
  private tabNames = ['inbox', 'sendbox', 'sendmail', 'account', 'appearance', 'autoreply', 'webhook', 'attachment', 'about'];

  constructor() {
    // Watch for indexTab changes from other components
    effect(() => {
      const tab = this.state.indexTab();
      const index = this.tabNames.indexOf(tab);
      if (index >= 0 && index !== this.selectedTab) {
        this.selectedTab = index;
      }
    });
  }

  async ngOnInit() {
    // AddressBarComponent 会处理 getOpenSettings 和 getSettings
    // 这里不需要重复调用
  }

  onTabChange(index: number) {
    if (index < this.tabNames.length) {
      this.state.indexTab.set(this.tabNames[index]);
    }
  }

  // Sendbox data fetching
  fetchSendboxData = async (limit: number, offset: number) => {
    return await this.api.fetch<{ results: any[]; count: number }>(`/api/sendbox?limit=${limit}&offset=${offset}`);
  };

  deleteSendboxMail = async (id: number) => {
    await this.api.fetch(`/api/sendbox/${id}`, { method: 'DELETE' });
  };
}
