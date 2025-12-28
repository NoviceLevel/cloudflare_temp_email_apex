import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalStateService } from './global-state.service';
import { TranslateService } from '@ngx-translate/core';

const API_BASE = '';

// JWT 过期提前刷新时间（秒）- 在过期前 5 分钟刷新
const JWT_REFRESH_THRESHOLD = 5 * 60;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private state = inject(GlobalStateService);
  private translate = inject(TranslateService);

  /**
   * 解析 JWT 获取过期时间
   */
  private parseJwtExpiration(token: string): number | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload.exp || null;
    } catch {
      return null;
    }
  }

  /**
   * 检查 JWT 是否即将过期
   */
  private isJwtExpiringSoon(token: string): boolean {
    const exp = this.parseJwtExpiration(token);
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return exp - now < JWT_REFRESH_THRESHOLD;
  }

  /**
   * 检查 JWT 是否已过期
   */
  private isJwtExpired(token: string): boolean {
    const exp = this.parseJwtExpiration(token);
    if (!exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  }

  /**
   * 尝试刷新用户 JWT（如果即将过期）
   */
  private async tryRefreshUserJwt(): Promise<void> {
    const userJwt = this.state.userJwt();
    if (!userJwt || !this.isJwtExpiringSoon(userJwt)) return;

    try {
      console.log('User JWT expiring soon, attempting refresh...');
      const res = await this.fetchInternal<any>('/user_api/settings', {}, true);
      if (res.new_user_token) {
        this.state.setUserJwt(res.new_user_token);
        console.log('User JWT refreshed successfully');
      }
    } catch (error) {
      console.warn('Failed to refresh user JWT:', error);
    }
  }

  /**
   * 内部 fetch 方法，skipJwtCheck 用于避免递归调用
   */
  private async fetchInternal<T = any>(
    path: string,
    options: { method?: string; body?: any; userJwt?: string } = {},
    skipJwtCheck: boolean = false
  ): Promise<T> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-lang': this.translate.currentLang || 'zh',
      'x-user-token': options.userJwt || this.state.userJwt() || '',
      'x-user-access-token': this.state.userSettings().access_token || '',
      'x-custom-auth': this.state.auth() || '',
      'x-admin-auth': this.state.adminAuth() || '',
      'x-fingerprint': this.state.browserFingerprint() || '',
      'Authorization': `Bearer ${this.state.jwt() || ''}`,
    });

    const url = API_BASE + path;
    let response: any;

    try {
      if (options.method === 'POST') {
        response = await firstValueFrom(
          this.http.post(url, options.body, { headers, observe: 'response' })
        );
      } else if (options.method === 'DELETE') {
        response = await firstValueFrom(
          this.http.delete(url, { headers, observe: 'response' })
        );
      } else if (options.method === 'PUT') {
        response = await firstValueFrom(
          this.http.put(url, options.body, { headers, observe: 'response' })
        );
      } else {
        response = await firstValueFrom(
          this.http.get(url, { headers, observe: 'response' })
        );
      }

      if (response.status === 401 && path.startsWith('/admin')) {
        this.state.showAdminAuth.set(true);
      }
      if (response.status === 401 && this.state.openSettings().needAuth) {
        this.state.showAuth.set(true);
      }
      if (response.status >= 300) {
        throw new Error(`[${response.status}]: ${response.body}` || 'error');
      }

      return response.body as T;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401 && path.startsWith('/admin')) {
          this.state.showAdminAuth.set(true);
        }
        if (error.status === 401 && this.state.openSettings().needAuth) {
          this.state.showAuth.set(true);
        }
        throw new Error(`[${error.status}]: ${error.error}` || 'error');
      }
      throw error;
    }
  }

  async fetch<T = any>(path: string, options: { method?: string; body?: any; userJwt?: string } = {}): Promise<T> {
    this.state.loading.set(true);
    try {
      // 检查用户 JWT 是否即将过期，尝试刷新（避免在 settings 请求中递归）
      if (!path.includes('/user_api/settings')) {
        await this.tryRefreshUserJwt();
      }

      // 检查邮箱地址 JWT 是否已过期
      const jwt = this.state.jwt();
      if (jwt && this.isJwtExpired(jwt) && path.startsWith('/api/') && !path.includes('/api/new_address') && !path.includes('/api/address_login')) {
        console.warn('Address JWT expired, clearing...');
        this.state.setJwt('');
        this.state.settings.update(current => ({ ...current, fetched: false, address: '' }));
        throw new Error('JWT expired, please login again');
      }

      return await this.fetchInternal<T>(path, options);
    } finally {
      this.state.loading.set(false);
    }
  }


  // 获取公开设置
  async getOpenSettings(): Promise<void> {
    try {
      const res = await this.fetch<any>('/open_api/settings');
      const domainLabels = res['domainLabels'] || [];

      if (!res['domains'] || res['domains'].length < 1) {
        console.error('No domains found, please check your worker settings');
      }

      const currentSettings = this.state.openSettings();
      const newAnnouncement = res['announcement'] || '';

      const mappedDomains = (res['domains'] || []).map((domain: string, index: number) => ({
        label: domainLabels.length > index ? domainLabels[index] : domain,
        value: domain,
      }));

      this.state.openSettings.update(current => ({
        ...current,
        ...res,
        title: res['title'] || '',
        prefix: res['prefix'] || '',
        minAddressLen: res['minAddressLen'] || 1,
        maxAddressLen: res['maxAddressLen'] || 30,
        needAuth: res['needAuth'] || false,
        defaultDomains: res['defaultDomains'] || [],
        domains: mappedDomains,
        adminContact: res['adminContact'] || '',
        enableUserCreateEmail: res['enableUserCreateEmail'] || false,
        disableAnonymousUserCreateEmail: res['disableAnonymousUserCreateEmail'] || false,
        disableCustomAddressName: res['disableCustomAddressName'] || false,
        enableUserDeleteEmail: res['enableUserDeleteEmail'] || false,
        enableAutoReply: res['enableAutoReply'] || false,
        enableIndexAbout: res['enableIndexAbout'] || false,
        copyright: res['copyright'] || current.copyright,
        cfTurnstileSiteKey: res['cfTurnstileSiteKey'] || '',
        enableWebhook: res['enableWebhook'] || false,
        isS3Enabled: res['isS3Enabled'] || false,
        enableAddressPassword: res['enableAddressPassword'] || false,
        fetched: true,
      }));

      if (this.state.openSettings().needAuth) {
        this.state.showAuth.set(true);
      }

      // Handle announcement
      if (newAnnouncement &&
        !currentSettings.fetched &&
        (newAnnouncement !== this.state.announcement() || res['alwaysShowAnnouncement'])) {
        this.state.setAnnouncement(newAnnouncement);
      }
    } catch (error: any) {
      console.error('getOpenSettings error:', error);
    } finally {
      this.state.openSettings.update(current => ({ ...current, fetched: true }));
    }
  }

  // 获取用户设置
  async getSettings(): Promise<void> {
    try {
      const jwt = this.state.jwt();
      if (typeof jwt !== 'string' || jwt.trim() === '' || jwt === 'undefined') {
        return;
      }
      const res = await this.fetch<any>('/api/settings');
      this.state.settings.set({
        fetched: true,
        address: res['address'],
        auto_reply: res['auto_reply'],
        send_balance: res['send_balance'],
      });
    } catch (error: any) {
      console.error('getSettings error:', error);
      throw error;
    } finally {
      this.state.settings.update(current => ({ ...current, fetched: true }));
    }
  }

  // 创建新邮箱
  async newAddress(name: string, domain: string, cfToken: string = ''): Promise<{ jwt: string; password?: string }> {
    return this.fetch('/api/new_address', {
      method: 'POST',
      body: { name, domain, cf_token: cfToken },
    });
  }

  // 密码登录
  async addressLogin(email: string, password: string): Promise<{ jwt: string }> {
    return this.fetch('/api/address_login', {
      method: 'POST',
      body: { email, password },
    });
  }

  // 绑定用户地址
  async bindUserAddress(): Promise<void> {
    if (!this.state.userJwt()) return;
    await this.fetch('/user_api/bind_address', { method: 'POST' });
  }

  // 获取用户公开设置
  async getUserOpenSettings(): Promise<void> {
    try {
      const res = await this.fetch<any>('/user_api/open_settings');
      this.state.userOpenSettings.update(current => ({
        ...current,
        ...res,
        fetched: true,
      }));
    } catch (error: any) {
      console.error('getUserOpenSettings error:', error);
    } finally {
      this.state.userOpenSettings.update(current => ({ ...current, fetched: true }));
    }
  }

  // 获取用户设置
  async getUserSettings(): Promise<void> {
    try {
      if (!this.state.userJwt()) return;
      const res = await this.fetch<any>('/user_api/settings');
      this.state.userSettings.update(current => ({
        ...current,
        ...res,
        fetched: true,
      }));

      // Auto refresh user jwt
      if (res.new_user_token) {
        try {
          await this.fetch('/user_api/settings', { userJwt: res.new_user_token });
          this.state.setUserJwt(res.new_user_token);
          console.log('User JWT updated successfully');
        } catch (error) {
          console.error('Failed to update user JWT', error);
        }
      }
    } catch (error: any) {
      console.error('getUserSettings error:', error);
    } finally {
      this.state.userSettings.update(current => ({ ...current, fetched: true }));
    }
  }

  // 用户登录
  async userLogin(email: string, password: string): Promise<{ jwt: string }> {
    return this.fetch('/user_api/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  // 用户注册
  async userRegister(email: string, password: string, code: string): Promise<any> {
    return this.fetch('/user_api/register', {
      method: 'POST',
      body: { email, password, code },
    });
  }

  // 发送验证码
  async sendVerifyCode(email: string, cfToken: string): Promise<{ expirationTtl: number }> {
    return this.fetch('/user_api/verify_code', {
      method: 'POST',
      body: { email, cf_token: cfToken },
    });
  }


  // Passkey 认证请求
  async passkeyAuthenticateRequest(domain: string): Promise<any> {
    return this.fetch('/user_api/passkey/authenticate_request', {
      method: 'POST',
      body: { domain },
    });
  }

  // Passkey 认证响应
  async passkeyAuthenticateResponse(origin: string, domain: string, credential: any): Promise<{ jwt: string }> {
    return this.fetch('/user_api/passkey/authenticate_response', {
      method: 'POST',
      body: { origin, domain, credential },
    });
  }

  // Passkey 注册请求
  async passkeyRegisterRequest(domain: string): Promise<any> {
    return this.fetch('/user_api/passkey/register_request', {
      method: 'POST',
      body: { domain },
    });
  }

  // Passkey 注册响应
  async passkeyRegisterResponse(origin: string, passkeyName: string, credential: any): Promise<void> {
    return this.fetch('/user_api/passkey/register_response', {
      method: 'POST',
      body: { origin, passkey_name: passkeyName, credential },
    });
  }

  // 获取 Passkey 列表
  async getPasskeyList(): Promise<any[]> {
    return this.fetch('/user_api/passkey');
  }

  // 重命名 Passkey
  async renamePasskey(passkeyId: string, passkeyName: string): Promise<void> {
    return this.fetch('/user_api/passkey/rename', {
      method: 'POST',
      body: { passkey_id: passkeyId, passkey_name: passkeyName },
    });
  }

  // 删除 Passkey
  async deletePasskey(passkeyId: string): Promise<void> {
    return this.fetch(`/user_api/passkey/${passkeyId}`, { method: 'DELETE' });
  }

  // OAuth2 登录 URL
  async getOauth2LoginUrl(clientID: string, state: string): Promise<{ url: string }> {
    return this.fetch(`/user_api/oauth2/login_url?clientID=${clientID}&state=${state}`);
  }

  // 获取绑定地址列表
  async getBindAddressList(): Promise<{ results: any[] }> {
    return this.fetch('/user_api/bind_address');
  }

  // 获取绑定地址 JWT
  async getBindAddressJwt(addressId: number): Promise<{ jwt: string }> {
    return this.fetch(`/user_api/bind_address_jwt/${addressId}`);
  }

  // 解绑地址
  async unbindAddress(addressId: number): Promise<void> {
    return this.fetch('/user_api/unbind_address', {
      method: 'POST',
      body: { address_id: addressId },
    });
  }

  // 转移地址
  async transferAddress(addressId: number, targetUserEmail: string): Promise<void> {
    return this.fetch('/user_api/transfer_address', {
      method: 'POST',
      body: { address_id: addressId, target_user_email: targetUserEmail },
    });
  }

  // 获取用户邮件
  async getUserMails(limit: number, offset: number, address?: string): Promise<{ results: any[]; count: number }> {
    let url = `/user_api/mails?limit=${limit}&offset=${offset}`;
    if (address) {
      url += `&address=${address}`;
    }
    return this.fetch(url);
  }

  // 删除用户邮件
  async deleteUserMail(mailId: number): Promise<void> {
    return this.fetch(`/user_api/mails/${mailId}`, { method: 'DELETE' });
  }

  // Admin APIs
  async adminShowAddressCredential(id: number): Promise<{ jwt: string }> {
    return this.fetch(`/admin/show_password/${id}`);
  }

  async adminDeleteAddress(id: number): Promise<void> {
    return this.fetch(`/admin/delete_address/${id}`, { method: 'DELETE' });
  }

  async adminGetAccounts(limit: number, offset: number, query?: string): Promise<{ results: any[]; count: number }> {
    let url = `/admin/address?limit=${limit}&offset=${offset}`;
    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }
    return this.fetch(url);
  }

  async adminGetMails(limit: number, offset: number, address?: string): Promise<{ results: any[]; count: number }> {
    let url = `/admin/mails?limit=${limit}&offset=${offset}`;
    if (address) {
      url += `&address=${encodeURIComponent(address)}`;
    }
    return this.fetch(url);
  }

  async adminDeleteMail(mailId: number): Promise<void> {
    return this.fetch(`/admin/mails/${mailId}`, { method: 'DELETE' });
  }

  async adminGetSendbox(limit: number, offset: number, address?: string): Promise<{ results: any[]; count: number }> {
    let url = `/admin/sendbox?limit=${limit}&offset=${offset}`;
    if (address) {
      url += `&address=${encodeURIComponent(address)}`;
    }
    return this.fetch(url);
  }

  async adminDeleteSendboxMail(mailId: number): Promise<void> {
    return this.fetch(`/admin/sendbox/${mailId}`, { method: 'DELETE' });
  }

  async adminGetUnknownMails(limit: number, offset: number): Promise<{ results: any[]; count: number }> {
    return this.fetch(`/admin/mails_unknow?limit=${limit}&offset=${offset}`);
  }

  async adminDeleteUnknownMail(mailId: number): Promise<void> {
    return this.fetch(`/admin/mails_unknow/${mailId}`, { method: 'DELETE' });
  }

  async adminGetStatistics(): Promise<any> {
    return this.fetch('/admin/statistics');
  }

  async adminCleanup(cleanType: string, beforeDays: number): Promise<any> {
    return this.fetch('/admin/cleanup', {
      method: 'POST',
      body: { cleanType, beforeDays },
    });
  }

  async adminGetUsers(limit: number, offset: number, query?: string): Promise<{ results: any[]; count: number }> {
    let url = `/admin/user_list?limit=${limit}&offset=${offset}`;
    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }
    return this.fetch(url);
  }

  async adminDeleteUser(userId: number): Promise<void> {
    return this.fetch(`/admin/user/${userId}`, { method: 'DELETE' });
  }

  async adminGetUserAddresses(userId: number): Promise<{ results: any[] }> {
    return this.fetch(`/admin/user_address/${userId}`);
  }

  async adminGetSenderAccess(limit: number, offset: number): Promise<{ results: any[]; count: number }> {
    return this.fetch(`/admin/sender_access?limit=${limit}&offset=${offset}`);
  }

  async adminUpdateSenderAccess(id: number, enabled: boolean, balance: number): Promise<void> {
    return this.fetch(`/admin/sender_access/${id}`, {
      method: 'PUT',
      body: { enabled, balance },
    });
  }

  async adminGetWorkerConfig(): Promise<any> {
    return this.fetch('/admin/worker_config');
  }

  async adminSaveWorkerConfig(config: any): Promise<void> {
    return this.fetch('/admin/worker_config', {
      method: 'POST',
      body: config,
    });
  }
}
