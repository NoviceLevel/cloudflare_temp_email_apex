import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';

export interface OpenSettings {
  fetched: boolean;
  title: string;
  prefix: string;
  domains: { label: string; value: string }[];
  needAuth: boolean;
  enableUserCreateEmail: boolean;
  enableUserDeleteEmail: boolean;
  enableAutoReply: boolean;
  enableIndexAbout: boolean;
  copyright: string;
  enableWebhook: boolean;
  showGithub: boolean;
  disableAdminPasswordCheck: boolean;
  announcement?: string;
  enableAddressPassword?: boolean;
  disableCustomAddressName?: boolean;
  maxAddressLen?: number;
}

export interface Settings {
  fetched: boolean;
  address: string;
  sendBalance: number;
  autoReply?: {
    subject: string;
    message: string;
    enabled: boolean;
  };
}

export interface UserSettings {
  fetched: boolean;
  userEmail: string;
  userId: number;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {
  // Theme
  isDark = signal(false);
  
  // Loading
  loading = signal(false);
  
  // Auth
  jwt = signal('');
  auth = signal('');
  adminAuth = signal('');
  userJwt = signal('');
  
  // Settings
  openSettings = signal<OpenSettings>({
    fetched: false,
    title: '',
    prefix: '',
    domains: [],
    needAuth: false,
    enableUserCreateEmail: false,
    enableUserDeleteEmail: false,
    enableAutoReply: false,
    enableIndexAbout: false,
    copyright: 'NoviceLevel',
    enableWebhook: false,
    showGithub: true,
    disableAdminPasswordCheck: false,
  });
  
  settings = signal<Settings>({
    fetched: false,
    address: '',
    sendBalance: 0,
  });
  
  userSettings = signal<UserSettings>({
    fetched: false,
    userEmail: '',
    userId: 0,
    isAdmin: false,
  });
  
  // UI State
  locale = signal('zh');
  indexTab = signal('mailbox');
  adminTab = signal('account');
  showAuth = signal(false);
  showAdminAuth = signal(false);
  autoRefresh = signal(false);
  autoRefreshInterval = signal(60);
  
  // Computed
  showAdminPage = computed(() => {
    return this.adminAuth() !== '' || 
           this.userSettings().isAdmin || 
           this.openSettings().disableAdminPasswordCheck;
  });

  constructor(private api: ApiService) {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      this.isDark.set(localStorage.getItem('isDark') === 'true');
      this.jwt.set(localStorage.getItem('jwt') || '');
      this.auth.set(localStorage.getItem('auth') || '');
      this.adminAuth.set(localStorage.getItem('adminAuth') || '');
      this.userJwt.set(localStorage.getItem('userJwt') || '');
      this.locale.set(localStorage.getItem('locale') || 'zh');
      this.autoRefresh.set(localStorage.getItem('autoRefresh') === 'true');
      this.autoRefreshInterval.set(parseInt(localStorage.getItem('autoRefreshInterval') || '60'));
      
      // Sync with API service
      this.api.setAuth({
        jwt: this.jwt(),
        auth: this.auth(),
        adminAuth: this.adminAuth(),
        userJwt: this.userJwt(),
        locale: this.locale(),
      });
    }
  }

  toggleDark() {
    this.isDark.update(v => !v);
    localStorage.setItem('isDark', String(this.isDark()));
  }

  setJwt(value: string) {
    this.jwt.set(value);
    localStorage.setItem('jwt', value);
    this.api.setAuth({ jwt: value });
  }

  setAuth(value: string) {
    this.auth.set(value);
    localStorage.setItem('auth', value);
    this.api.setAuth({ auth: value });
  }

  setAdminAuth(value: string) {
    this.adminAuth.set(value);
    localStorage.setItem('adminAuth', value);
    this.api.setAuth({ adminAuth: value });
  }

  setUserJwt(value: string) {
    this.userJwt.set(value);
    localStorage.setItem('userJwt', value);
    this.api.setAuth({ userJwt: value });
  }

  setLocale(value: string) {
    this.locale.set(value);
    localStorage.setItem('locale', value);
    this.api.setAuth({ locale: value });
  }

  setAutoRefresh(value: boolean) {
    this.autoRefresh.set(value);
    localStorage.setItem('autoRefresh', String(value));
  }

  setAutoRefreshInterval(value: number) {
    this.autoRefreshInterval.set(value);
    localStorage.setItem('autoRefreshInterval', String(value));
  }

  logout() {
    this.setJwt('');
    this.settings.set({ fetched: false, address: '', sendBalance: 0 });
  }
}
