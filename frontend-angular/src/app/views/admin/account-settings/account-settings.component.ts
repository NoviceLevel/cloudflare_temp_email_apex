import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GlobalStateService } from '../../../services/global-state.service';
import { ApiService } from '../../../services/api.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { ALL_ADMIN_STYLES } from '../admin-shared.styles';

@Component({
  selector: 'app-admin-account-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule,
    MatChipsModule, MatIconModule, MatSlideToggleModule, MatSelectModule, MatDialogModule
  ],
  template: `
    <div class="settings-page">
      <!-- 提示信息 -->
      <div class="admin-alert info mb-4">
        <mat-icon>info</mat-icon>
        <span>您可以手动输入以下多选输入框，按回车键添加新项目</span>
      </div>

      <!-- 地址屏蔽设置 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>block</mat-icon>
          地址屏蔽设置
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="form-group">
              <label class="form-label">邮件地址屏蔽关键词</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-chip-grid #chipGrid1>
                  @for (item of addressBlockList; track item) {
                    <mat-chip-row (removed)="removeItem(addressBlockList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid1" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(addressBlockList, $event)" placeholder="输入后按回车添加">
              </mat-form-field>
              <div class="form-hint">包含这些关键词的地址将被屏蔽</div>
            </div>

            <div class="form-group">
              <label class="form-label">发送邮件地址屏蔽关键词</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-chip-grid #chipGrid2>
                  @for (item of sendAddressBlockList; track item) {
                    <mat-chip-row (removed)="removeItem(sendAddressBlockList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid2" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(sendAddressBlockList, $event)" placeholder="输入后按回车添加">
              </mat-form-field>
            </div>

            <div class="form-group">
              <label class="form-label">接收邮件地址屏蔽关键词</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-chip-grid #chipGrid5>
                  @for (item of fromBlockList; track item) {
                    <mat-chip-row (removed)="removeItem(fromBlockList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid5" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(fromBlockList, $event)" placeholder="输入后按回车添加">
              </mat-form-field>
            </div>
          </div>
        </div>
      </div>

      <!-- 特殊地址设置 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>verified</mat-icon>
          特殊地址设置
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="form-group">
              <label class="form-label">无余额限制发送地址列表</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-chip-grid #chipGrid3>
                  @for (item of noLimitSendAddressList; track item) {
                    <mat-chip-row (removed)="removeItem(noLimitSendAddressList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid3" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(noLimitSendAddressList, $event)" placeholder="输入后按回车添加">
              </mat-form-field>
              <div class="form-hint">这些地址发送邮件不受余额限制</div>
            </div>

            <div class="form-group">
              <label class="form-label">已验证地址列表</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-chip-grid #chipGrid4>
                  @for (item of verifiedAddressList; track item) {
                    <mat-chip-row (removed)="removeItem(verifiedAddressList, item)">{{item}}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
                  }
                </mat-chip-grid>
                <input matInput [matChipInputFor]="chipGrid4" [matChipInputSeparatorKeyCodes]="separatorKeyCodes" (matChipInputTokenEnd)="addItem(verifiedAddressList, $event)" placeholder="输入后按回车添加">
              </mat-form-field>
            </div>
          </div>
        </div>
      </div>

      <!-- 邮件规则设置 -->
      <div class="admin-section">
        <div class="admin-section-title">
          <mat-icon>rule</mat-icon>
          邮件规则设置
        </div>
        <div class="admin-card">
          <div class="admin-card-body">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">禁止接收未知地址邮件</div>
                <div class="setting-desc">开启后，未在系统中注册的地址将无法接收邮件</div>
              </div>
              <mat-slide-toggle [(ngModel)]="emailRuleSettings.blockReceiveUnknowAddressEmail"></mat-slide-toggle>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-title">邮件转发配置</div>
                <div class="setting-desc">配置邮件自动转发规则</div>
              </div>
              <button mat-stroked-button (click)="openForwardingDialog()">
                <mat-icon>settings</mat-icon>
                配置
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 保存按钮 -->
      <div class="form-actions">
        <button mat-raised-button color="primary" (click)="save()" [disabled]="state.loading()">
          <mat-icon>save</mat-icon>
          保存设置
        </button>
      </div>
    </div>
  `,
  styles: [`
    ${ALL_ADMIN_STYLES}
    .settings-page { max-width: 800px; }
    .setting-item { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #e0e0e0; }
    .setting-item:last-child { border-bottom: none; }
    :host-context(.dark) .setting-item { border-color: #3c4043; }
    .setting-info { flex: 1; }
    .setting-title { font-size: 14px; font-weight: 500; color: #202124; }
    :host-context(.dark) .setting-title { color: #e8eaed; }
    .setting-desc { font-size: 12px; color: #5f6368; margin-top: 2px; }
    :host-context(.dark) .setting-desc { color: #9aa0a6; }
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

  async ngOnInit() { await this.fetchData(); }

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
      width: '600px',
      maxWidth: '95vw',
      data: { emailForwardingList: [...this.emailRuleSettings.emailForwardingList], domains: this.state.openSettings().domains }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) this.emailRuleSettings.emailForwardingList = result;
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

@Component({
  selector: 'app-forwarding-config-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>邮件转发配置</h2>
    <mat-dialog-content>
      <div class="admin-alert warning mb-3">
        <mat-icon>warning</mat-icon>
        <span>每条规则都会运行，如果域名为空则转发所有邮件，转发地址需要为已验证的地址</span>
      </div>
      <div class="rules-list">
        @for (rule of emailForwardingList; track $index) {
          <div class="rule-card">
            <div class="rule-header">
              <span>规则 {{ $index + 1 }}</span>
              <button mat-icon-button color="warn" (click)="removeRule($index)"><mat-icon>delete</mat-icon></button>
            </div>
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
              <input matInput [(ngModel)]="rule.forward" placeholder="example@domain.com">
            </mat-form-field>
          </div>
        }
      </div>
      <button mat-stroked-button (click)="addRule()" class="add-btn"><mat-icon>add</mat-icon>添加规则</button>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>取消</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="emailForwardingList">保存</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .admin-alert { padding: 12px 16px; border-radius: 4px; font-size: 14px; display: flex; align-items: flex-start; gap: 12px; }
    .admin-alert mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .admin-alert.warning { background: #fef7e0; color: #ea8600; }
    .full-width { width: 100%; }
    .mb-2 { margin-bottom: 8px; }
    .mb-3 { margin-bottom: 16px; }
    .rules-list { max-height: 400px; overflow-y: auto; }
    .rule-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .rule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-weight: 500; }
    .add-btn { width: 100%; margin-top: 8px; }
  `]
})
export class ForwardingConfigDialogComponent {
  data = inject(MAT_DIALOG_DATA);
  emailForwardingList = [...this.data.emailForwardingList];
  addRule() { this.emailForwardingList.push({ domains: [], forward: '' }); }
  removeRule(index: number) { this.emailForwardingList.splice(index, 1); }
}
