import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';
import { I18nService } from '../../services/i18n.service';
import { AddressBarComponent } from './address-bar/address-bar.component';
import { MailBoxComponent } from './mail-box/mail-box.component';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AddressBarComponent,
    MailBoxComponent,
  ],
  template: `
    <div class="index-container">
      <!-- Address Bar -->
      <app-address-bar />
      
      <!-- Main Content -->
      <mat-card class="main-card">
        <mat-tab-group 
          [(selectedIndex)]="selectedTabIndex"
          (selectedIndexChange)="onTabChange($event)"
          mat-stretch-tabs="false">
          
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>inbox</mat-icon>
              {{ t()('mailbox') }}
            </ng-template>
            <div class="tab-content">
              <app-mail-box />
            </div>
          </mat-tab>
          
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>outbox</mat-icon>
              {{ t()('sendbox') }}
            </ng-template>
            <div class="tab-content">
              <p>{{ t()('sendbox') }} - Coming soon</p>
            </div>
          </mat-tab>
          
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>edit</mat-icon>
              {{ t()('sendmail') }}
            </ng-template>
            <div class="tab-content">
              <p>{{ t()('sendmail') }} - Coming soon</p>
            </div>
          </mat-tab>
          
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>settings</mat-icon>
              {{ t()('settings') }}
            </ng-template>
            <div class="tab-content">
              <p>{{ t()('settings') }} - Coming soon</p>
            </div>
          </mat-tab>
          
          @if (state.openSettings().enableAutoReply) {
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>reply_all</mat-icon>
                {{ t()('autoReply') }}
              </ng-template>
              <div class="tab-content">
                <p>{{ t()('autoReply') }} - Coming soon</p>
              </div>
            </mat-tab>
          }
          
          @if (state.openSettings().enableWebhook) {
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>webhook</mat-icon>
                {{ t()('webhook') }}
              </ng-template>
              <div class="tab-content">
                <p>{{ t()('webhook') }} - Coming soon</p>
              </div>
            </mat-tab>
          }
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .index-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 16px;
    }
    
    .main-card {
      margin-top: 16px;
    }
    
    .tab-content {
      padding: 16px;
      min-height: 400px;
    }
    
    mat-tab-group {
      mat-icon {
        margin-right: 8px;
      }
    }
  `]
})
export class IndexComponent implements OnInit {
  state = inject(StateService);
  private api = inject(ApiService);
  private i18n = inject(I18nService);
  private snackBar = inject(MatSnackBar);
  
  t = this.i18n.t;
  selectedTabIndex = 0;
  
  ngOnInit() {
    this.loadOpenSettings();
    this.loadSettings();
  }
  
  async loadOpenSettings() {
    try {
      const data = await this.api.getOpenSettings().toPromise();
      const domains = (data.domains || []).map((d: string, i: number) => ({
        label: data.domainLabels?.[i] || d,
        value: d
      }));
      
      this.state.openSettings.set({
        fetched: true,
        title: data.title || '',
        prefix: data.prefix || '',
        domains,
        needAuth: data.needAuth || false,
        enableUserCreateEmail: data.enableUserCreateEmail || false,
        enableUserDeleteEmail: data.enableUserDeleteEmail || false,
        enableAutoReply: data.enableAutoReply || false,
        enableIndexAbout: data.enableIndexAbout || false,
        copyright: data.copyright || 'NoviceLevel',
        enableWebhook: data.enableWebhook || false,
        showGithub: data.showGithub !== false,
        disableAdminPasswordCheck: data.disableAdminPasswordCheck || false,
        announcement: data.announcement,
      });
    } catch (e: any) {
      this.snackBar.open(e.message, 'OK', { duration: 3000 });
    }
  }
  
  async loadSettings() {
    if (!this.state.jwt()) return;
    
    try {
      const data = await this.api.getSettings().toPromise();
      this.state.settings.set({
        fetched: true,
        address: data.address || '',
        sendBalance: data.send_balance || 0,
        autoReply: data.auto_reply,
      });
    } catch (e: any) {
      // Ignore auth errors
    }
  }
  
  onTabChange(index: number) {
    const tabs = ['mailbox', 'sendbox', 'sendmail', 'settings', 'autoReply', 'webhook'];
    this.state.indexTab.set(tabs[index] || 'mailbox');
  }
}
