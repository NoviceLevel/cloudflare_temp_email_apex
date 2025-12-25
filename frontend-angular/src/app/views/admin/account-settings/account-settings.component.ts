import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-admin-account-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatChipsModule, MatIconModule, MatSlideToggleModule, MatSelectModule, MatDialogModule
  ],
  template: `
    <div class="container">
      <mat-card class="form-card">
        <mat-card-content>
          <div class="alert warning mb-3">您可以手动输入以下多选输入框, 回车增加</div>
          <div class="actions-row mb-3">
            <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">保存</button>
          </div>
          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>邮件地址屏蔽关键词</mat-label>
            <mat-chip-grid #chipGrid1>
              @for (item of addressBlockList; track item) {
                <mat-chip-row (removed)="removeItem(addressBlockList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid1" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(addressBlockList, $event)">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>发送邮件地址屏蔽关键词</mat-label>
            <mat-chip-grid #chipGrid2>
              @for (item of sendAddressBlockList; track item) {
                <mat-chip-row (removed)="removeItem(sendAddressBlockList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid2" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(sendAddressBlockList, $event)">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>无余额限制发送地址列表</mat-label>
            <mat-chip-grid #chipGrid3>
              @for (item of noLimitSendAddressList; track item) {
                <mat-chip-row (removed)="removeItem(noLimitSendAddressList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid3" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(noLimitSendAddressList, $event)">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>已验证地址列表</mat-label>
            <mat-chip-grid #chipGrid4>
              @for (item of verifiedAddressList; track item) {
                <mat-chip-row (removed)="removeItem(verifiedAddressList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid4" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(verifiedAddressList, $event)">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width mb-3">
            <mat-label>接收邮件地址屏蔽关键词</mat-label>
            <mat-chip-grid #chipGrid5>
              @for (item of fromBlockList; track item) {
                <mat-chip-row (removed)="removeItem(fromBlockList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
              }
            </mat-chip-grid>
            <input matInput [matChipInputFor]="chipGrid5" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(fromBlockList, $event)">
          </mat-form-field>
          <mat-slide-toggle [(ngModel)]="emailRuleSettings.blockReceiveUnknowAddressEmail" class="mb-3">禁止接收未知地址邮件</mat-slide-toggle>
          <div class="config-row">
            <span>邮件转发配置:</span>
            <button mat-stroked-button (click)="openForwardingDialog()">配置</button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { display: flex; justify-content: center; padding: 20px; }
    .form-card { max-width: 600px; width: 100%; }
    .full-width { width: 100%; }
    .mb-3 { margin-bottom: 12px; }
    .alert { padding: 12px 16px; border-radius: 4px; }
    .alert.warning { background-color: #fff3e0; color: #e65100; }
    .actions-row { display: flex; justify-content: flex-end; gap: 8px; }
    .config-row { display: flex; align-items: center; gap: 8px; }
  `]
})
export class AdminAccountSettingsComponent implements OnInit {
  state = inject(GlobalStateService);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);

  separatorKeyCodes = [ENTER, COMMA];
  addressBlockList: string[] = [];
  sendAddressBlockList: string[] = [];
  noLimitSendAddressList: string[] = [];
  verifiedAddressList: string[] = [];
  fromBlockList: string[] = [];
  emailRuleSettings = { blockReceiveUnknowAddressEmail: false, emailForwardingList: [] as any[] };

  async ngOnInit() {
    await this.fetchData();
  }

  async fetchData() {
    try {
      const res = await this.api.fetch<any>('/admin/account_settings');
      this.addressBlockList = res.blockList || [];
      this.sendAddressBlockList = res.sendBlockList || [];
      this.verifiedAddressList = res.verifiedAddressList || [];
      this.fromBlockList = res.fromBlockList || [];
      this.noLimitSendAddressList = res.noLimitSendAddressList || [];
      this.emailRuleSettings = res.emailRuleSettings || { blockReceiveUnknowAddressEmail: false, emailForwardingList: [] };
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

  openForwardingDialog() {
    const dialogRef = this.dialog.open(ForwardingConfigDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { emailForwardingList: [...this.emailRuleSettings.emailForwardingList], domains: this.state.openSettings().domains }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.emailRuleSettings.emailForwardingList = result;
      }
    });
  }

  async save() {
    try {
      await this.api.fetch('/admin/account_settings', {
        method: 'POST',
        body: {
          blockList: this.addressBlockList,
          sendBlockList: this.sendAddressBlockList,
          verifiedAddressList: this.verifiedAddressList,
          fromBlockList: this.fromBlockList,
          noLimitSendAddressList: this.noLimitSendAddressList,
          emailRuleSettings: this.emailRuleSettings
        }
      });
      this.snackbar.success('保存成功');
    } catch (error: any) {
      this.snackbar.error(error.message || '保存失败');
    }
  }
}

// Forwarding Config Dialog
@Component({
  selector: 'app-forwarding-config-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>邮件转发配置</h2>
    <mat-dialog-content>
      <div class="alert warning mb-3">每条规则都会运行，如果 domains 为空，则转发所有邮件，转发地址需要为已验证的地址</div>
      <div class="actions-row mb-3"><button mat-stroked-button (click)="addRule()">添加</button></div>
      @for (rule of emailForwardingList; track $index) {
        <mat-card class="mb-3">
          <mat-card-content>
            <mat-form-field appearance="outline" class="full-width mb-2">
              <mat-label>域名列表</mat-label>
              <mat-select [(ngModel)]="rule.domains" multiple>
                @for (domain of data.domains; track domain.value) {
                  <mat-option [value]="domain.value">{{ domain.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>转发地址</mat-label>
              <input matInput [(ngModel)]="rule.forward">
            </mat-form-field>
            <button mat-button color="warn" (click)="removeRule($index)">删除</button>
          </mat-card-content>
        </mat-card>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="emailForwardingList">保存</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 12px; }
    .alert { padding: 12px 16px; border-radius: 4px; }
    .alert.warning { background-color: #fff3e0; color: #e65100; }
    .actions-row { display: flex; justify-content: flex-end; }
  `]
})
export class ForwardingConfigDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  emailForwardingList = [...this.data.emailForwardingList];

  addRule() {
    this.emailForwardingList.push({ domains: [], forward: '' });
  }

  removeRule(index: number) {
    this.emailForwardingList.splice(index, 1);
  }
}
