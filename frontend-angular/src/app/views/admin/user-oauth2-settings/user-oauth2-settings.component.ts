import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

interface UserOauth2Settings {
  name: string;
  clientID: string;
  clientSecret: string;
  authorizationURL: string;
  accessTokenURL: string;
  accessTokenFormat: string;
  userInfoURL: string;
  userEmailKey: string;
  redirectURL: string;
  logoutURL: string;
  scope: string;
  enableMailAllowList: boolean;
  mailAllowList: string[];
}

const COMMON_MAIL = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'qq.com', '163.com', '126.com'];

@Component({
  selector: 'app-admin-user-oauth2-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatCheckboxModule, MatChipsModule, MatIconModule, MatExpansionModule,
    MatButtonToggleModule, MatDialogModule, MatProgressSpinnerModule, TranslateModule
  ],
  template: `
    <div class="center">
      <mat-card appearance="outlined" class="settings-card">
        <mat-card-content>
          <div class="alert-warning mb-4"><mat-icon>warning</mat-icon><span>{{ 'tip' | translate }}</span></div>
          <div class="actions-row mb-4">
            <button mat-stroked-button (click)="openAddOauth2Dialog()">{{ 'addOauth2' | translate }}</button>
            <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">{{ 'save' | translate }}</button>
          </div>
          <mat-accordion>
            @for (item of userOauth2Settings(); track $index) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>{{ item.name }}</mat-panel-title>
                  <mat-panel-description>
                    <button mat-stroked-button color="warn" size="small" (click)="confirmDelete($index); $event.stopPropagation()">{{ 'delete' | translate }}</button>
                  </mat-panel-description>
                </mat-expansion-panel-header>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>{{ 'name' | translate }}</mat-label><input matInput [(ngModel)]="item.name"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>Client ID</mat-label><input matInput [(ngModel)]="item.clientID"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>Client Secret</mat-label><input matInput [(ngModel)]="item.clientSecret" type="password"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>Authorization URL</mat-label><input matInput [(ngModel)]="item.authorizationURL"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>Access Token URL</mat-label><input matInput [(ngModel)]="item.accessTokenURL"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2">
                  <mat-label>Access Token Params Format</mat-label>
                  <mat-select [(ngModel)]="item.accessTokenFormat"><mat-option value="json">json</mat-option><mat-option value="urlencoded">urlencoded</mat-option></mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>User Info URL</mat-label><input matInput [(ngModel)]="item.userInfoURL"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>User Email Key (Support JSONPATH like $[0].email)</mat-label><input matInput [(ngModel)]="item.userEmailKey"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>Redirect URL</mat-label><input matInput [(ngModel)]="item.redirectURL"></mat-form-field>
                <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>Scope</mat-label><input matInput [(ngModel)]="item.scope"></mat-form-field>
                <div class="checkbox-row mb-2"><mat-checkbox [(ngModel)]="item.enableMailAllowList">{{ 'enable' | translate }}</mat-checkbox></div>
                @if (item.enableMailAllowList) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>{{ 'mailAllowList' | translate }}</mat-label>
                    <mat-chip-grid #chipGrid>
                      @for (mail of item.mailAllowList; track mail) {
                        <mat-chip-row (removed)="removeMailFromList(item, mail)">{{ mail }}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
                      }
                    </mat-chip-grid>
                    <input matInput [matChipInputFor]="chipGrid" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addMailToList(item, $event)">
                  </mat-form-field>
                }
              </mat-expansion-panel>
            }
          </mat-accordion>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .center { display: flex; justify-content: center; text-align: left; }
    .settings-card { max-width: 600px; width: 100%; padding: 16px; }
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .mb-4 { margin-bottom: 16px; }
    .actions-row { display: flex; justify-content: flex-end; gap: 8px; }
    .checkbox-row { display: flex; align-items: center; gap: 16px; }
    .alert-warning { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fff3e0; border-radius: 4px; color: #e65100; }
    :host-context(.dark-theme) .alert-warning { background: #4a3000; color: #ffb74d; }
  `]
})
export class AdminUserOauth2SettingsComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private dialog = inject(MatDialog);

  userOauth2Settings = signal<UserOauth2Settings[]>([]);
  readonly separatorKeyCodes = [ENTER, COMMA] as const;

  async ngOnInit() { await this.fetchData(); }

  async fetchData() {
    try {
      const res = await this.api.fetch<UserOauth2Settings[]>('/admin/user_oauth2_settings');
      this.userOauth2Settings.set(res || []);
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  async save() {
    try {
      await this.api.fetch('/admin/user_oauth2_settings', { method: 'POST', body: JSON.stringify(this.userOauth2Settings()) });
      this.snackbar.success(this.translate.instant('successTip'));
    } catch (error: any) {
      this.snackbar.error(error.message || 'error');
    }
  }

  openAddOauth2Dialog() {
    const dialogRef = this.dialog.open(AddOauth2DialogComponent, { width: '450px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userOauth2Settings.update(list => [...list, result]);
      }
    });
  }

  confirmDelete(index: number) {
    const dialogRef = this.dialog.open(Oauth2ConfirmDialogComponent, { width: '320px' });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userOauth2Settings.update(list => list.filter((_, i) => i !== index));
      }
    });
  }

  addMailToList(item: UserOauth2Settings, event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value) item.mailAllowList.push(value);
    event.chipInput!.clear();
  }

  removeMailFromList(item: UserOauth2Settings, mail: string) {
    const index = item.mailAllowList.indexOf(mail);
    if (index >= 0) item.mailAllowList.splice(index, 1);
  }
}

// Add OAuth2 Dialog
@Component({
  selector: 'app-add-oauth2-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatButtonToggleModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'addOauth2' | translate }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width mb-2"><mat-label>{{ 'name' | translate }}</mat-label><input matInput [(ngModel)]="name"></mat-form-field>
      <div class="mb-2">{{ 'oauth2Type' | translate }}</div>
      <mat-button-toggle-group [(ngModel)]="type">
        <mat-button-toggle value="github">Github</mat-button-toggle>
        <mat-button-toggle value="authentik">Authentik</mat-button-toggle>
        <mat-button-toggle value="custom">Custom</mat-button-toggle>
      </mat-button-toggle-group>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="add()">{{ 'addOauth2' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; } .mb-2 { margin-bottom: 8px; }`]
})
export class AddOauth2DialogComponent {
  private dialogRef = inject(MatDialogRef<AddOauth2DialogComponent>);
  name = '';
  type = 'custom';

  add() {
    const getAuthorizationURL = () => { switch (this.type) { case 'github': return 'https://github.com/login/oauth/authorize'; case 'authentik': return 'https://youdomain/application/o/authorize/'; default: return ''; } };
    const getAccessTokenURL = () => { switch (this.type) { case 'github': return 'https://github.com/login/oauth/access_token'; case 'authentik': return 'https://youdomain/application/o/token/'; default: return ''; } };
    const getAccessTokenFormat = () => { switch (this.type) { case 'github': return 'json'; case 'authentik': return 'urlencoded'; default: return ''; } };
    const getUserInfoURL = () => { switch (this.type) { case 'github': return 'https://api.github.com/user'; case 'authentik': return 'https://youdomain/application/o/userinfo/'; default: return ''; } };
    const getUserEmailKey = () => { switch (this.type) { case 'github': case 'authentik': return 'email'; default: return ''; } };
    const getScope = () => { switch (this.type) { case 'github': return 'user:email'; case 'authentik': return 'email openid'; default: return ''; } };

    this.dialogRef.close({
      name: this.name, clientID: '', clientSecret: '', authorizationURL: getAuthorizationURL(), accessTokenURL: getAccessTokenURL(),
      accessTokenFormat: getAccessTokenFormat(), userInfoURL: getUserInfoURL(), userEmailKey: getUserEmailKey(),
      redirectURL: `${window.location.origin}/user/oauth2/callback`, logoutURL: '', scope: getScope(),
      enableMailAllowList: false, mailAllowList: [...COMMON_MAIL]
    });
  }
}

// Confirm Dialog
@Component({
  selector: 'app-oauth2-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'delete' | translate }}</h2>
    <mat-dialog-content>{{ 'delete' | translate }}?</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'cancel' | translate }}</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">{{ 'confirm' | translate }}</button>
    </mat-dialog-actions>
  `
})
export class Oauth2ConfirmDialogComponent {}
