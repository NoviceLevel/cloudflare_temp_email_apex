import { Injectable, signal, computed } from '@angular/core';

export interface OpenSettings {
  fetched: boolean;
  title: string;
  announcement: string;
  alwaysShowAnnouncement: boolean;
  prefix: string;
  addressRegex: string;
  needAuth: boolean;
  adminContact: string;
  enableUserCreateEmail: boolean;
  disableAnonymousUserCreateEmail: boolean;
  disableCustomAddressName: boolean;
  enableUserDeleteEmail: boolean;
  enableAutoReply: boolean;
  enableIndexAbout: boolean;
  defaultDomains: string[];
  domains: { label: string; value: string }[];
  copyright: string;
  cfTurnstileSiteKey: string;
  enableWebhook: boolean;
  isS3Enabled: boolean;
  showGithub: boolean;
  disableAdminPasswordCheck: boolean;
  enableAddressPassword: boolean;
  minAddressLen: number;
  maxAddressLen: number;
}

export interface Settings {
  fetched: boolean;
  send_balance: number;
  address: string;
  auto_reply: {
    subject: string;
    message: string;
    enabled: boolean;
    source_prefix: string;
    name: string;
  };
}

export interface UserSettings {
  fetched: boolean;
  user_email: string;
  user_id: number;
  is_admin: boolean;
  access_token: string | null;
  new_user_token: string | null;
  user_role: { domains?: string[]; role: string; prefix?: string } | null;
}

export interface UserOpenSettings {
  fetched: boolean;
  enable: boolean;
  enableMailVerify: boolean;
  oauth2ClientIDs: { clientID: string; name: string }[];
}

export interface SendMailModel {
  fromName: string;
  toName: string;
  toMail: string;
  subject: string;
  contentType: string;
  content: string;
}

export interface SavedAddress {
  address: string;
  jwt: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalStateService {
  // Theme - use system preference if no localStorage value
  isDark = signal(this.getInitialDarkMode());

  private getInitialDarkMode(): boolean {
    const stored = localStorage.getItem('isDark');
    if (stored !== null) {
      return stored === 'true';
    }
    // Follow system preference
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Loading state
  loading = signal(false);

  // Auth tokens
  jwt = signal(localStorage.getItem('jwt') || '');
  auth = signal(localStorage.getItem('auth') || '');
  adminAuth = signal(localStorage.getItem('adminAuth') || '');
  userJwt = signal(localStorage.getItem('userJwt') || '');
  addressPassword = signal(sessionStorage.getItem('addressPassword') || '');

  // UI state
  showAuth = signal(false);
  showAddressCredential = signal(false);
  showAdminAuth = signal(false);

  // Tab state
  indexTab = signal(sessionStorage.getItem('indexTab') || 'mailbox');
  adminTab = signal(sessionStorage.getItem('adminTab') || 'account');
  userTab = signal(sessionStorage.getItem('userTab') || 'address_management');
  adminMailTabAddress = signal('');
  adminSendBoxTabAddress = signal('');

  // Announcement
  announcement = signal(localStorage.getItem('announcement') || '');

  // Settings
  openSettings = signal<OpenSettings>({
    fetched: false,
    title: '',
    announcement: '',
    alwaysShowAnnouncement: false,
    prefix: '',
    addressRegex: '',
    needAuth: false,
    adminContact: '',
    enableUserCreateEmail: false,
    disableAnonymousUserCreateEmail: false,
    disableCustomAddressName: false,
    enableUserDeleteEmail: false,
    enableAutoReply: false,
    enableIndexAbout: false,
    defaultDomains: [],
    domains: [],
    copyright: 'Dream Hunter',
    cfTurnstileSiteKey: '',
    enableWebhook: false,
    isS3Enabled: false,
    showGithub: true,
    disableAdminPasswordCheck: false,
    enableAddressPassword: false,
    minAddressLen: 1,
    maxAddressLen: 30,
  });

  settings = signal<Settings>({
    fetched: false,
    send_balance: 0,
    address: '',
    auto_reply: {
      subject: '',
      message: '',
      enabled: false,
      source_prefix: '',
      name: '',
    },
  });

  userSettings = signal<UserSettings>({
    fetched: false,
    user_email: '',
    user_id: 0,
    is_admin: false,
    access_token: null,
    new_user_token: null,
    user_role: null,
  });

  userOpenSettings = signal<UserOpenSettings>({
    fetched: false,
    enable: false,
    enableMailVerify: false,
    oauth2ClientIDs: [],
  });

  // Send mail model
  sendMailModel = signal<SendMailModel>(
    JSON.parse(sessionStorage.getItem('sendMailModel') || JSON.stringify({
      fromName: '',
      toName: '',
      toMail: '',
      subject: '',
      contentType: 'text',
      content: '',
    }))
  );

  // UI preferences
  mailboxSplitSize = signal(parseFloat(localStorage.getItem('mailboxSplitSize') || '0.25'));
  useIframeShowMail = signal(localStorage.getItem('useIframeShowMail') === 'true');
  preferShowTextMail = signal(localStorage.getItem('preferShowTextMail') === 'true');
  globalTabplacement = signal(localStorage.getItem('globalTabplacement') || 'top');
  useSideMargin = signal(localStorage.getItem('useSideMargin') !== 'false');
  useUTCDate = signal(localStorage.getItem('useUTCDate') === 'true');
  autoRefresh = signal(localStorage.getItem('autoRefresh') === 'true');
  configAutoRefreshInterval = signal(parseInt(localStorage.getItem('configAutoRefreshInterval') || '60'));
  useSimpleIndex = signal(localStorage.getItem('useSimpleIndex') !== 'false');

  // OAuth2 session
  userOauth2SessionState = signal(sessionStorage.getItem('userOauth2SessionState') || '');
  userOauth2SessionClientID = signal(sessionStorage.getItem('userOauth2SessionClientID') || '');

  // Telegram
  telegramApp = signal<any>(typeof window !== 'undefined' ? (window as any).Telegram?.WebApp || {} : {});
  isTelegram = signal(typeof window !== 'undefined' ? !!(window as any).Telegram?.WebApp?.initData : false);

  // Browser fingerprint
  browserFingerprint = signal('');

  // Gmail layout state
  searchQuery = signal('');
  refreshTrigger = signal(0);

  // Saved addresses for multi-address support
  savedAddresses = signal<SavedAddress[]>(
    JSON.parse(localStorage.getItem('savedAddresses') || '[]')
  );

  // Computed
  showAdminPage = computed(() =>
    !!this.adminAuth() ||
    this.userSettings().is_admin ||
    this.openSettings().disableAdminPasswordCheck
  );

  // Persist to localStorage
  setJwt(value: string) {
    this.jwt.set(value);
    localStorage.setItem('jwt', value);
  }

  setAuth(value: string) {
    this.auth.set(value);
    localStorage.setItem('auth', value);
  }

  setAdminAuth(value: string) {
    this.adminAuth.set(value);
    localStorage.setItem('adminAuth', value);
  }

  setUserJwt(value: string) {
    this.userJwt.set(value);
    localStorage.setItem('userJwt', value);
  }

  setAddressPassword(value: string) {
    this.addressPassword.set(value);
    sessionStorage.setItem('addressPassword', value);
  }

  setIndexTab(value: string) {
    this.indexTab.set(value);
    sessionStorage.setItem('indexTab', value);
  }

  setAdminTab(value: string) {
    this.adminTab.set(value);
    sessionStorage.setItem('adminTab', value);
  }

  setUserTab(value: string) {
    this.userTab.set(value);
    sessionStorage.setItem('userTab', value);
  }

  setAnnouncement(value: string) {
    this.announcement.set(value);
    localStorage.setItem('announcement', value);
  }

  setSendMailModel(value: SendMailModel) {
    this.sendMailModel.set(value);
    sessionStorage.setItem('sendMailModel', JSON.stringify(value));
  }

  setUserOauth2SessionState(value: string) {
    this.userOauth2SessionState.set(value);
    sessionStorage.setItem('userOauth2SessionState', value);
  }

  setUserOauth2SessionClientID(value: string) {
    this.userOauth2SessionClientID.set(value);
    sessionStorage.setItem('userOauth2SessionClientID', value);
  }

  toggleDark() {
    const newValue = !this.isDark();
    this.isDark.set(newValue);
    localStorage.setItem('isDark', String(newValue));
  }

  // Save UI preferences
  savePreference(key: string, value: any) {
    localStorage.setItem(key, String(value));
    switch (key) {
      case 'mailboxSplitSize':
        this.mailboxSplitSize.set(value);
        break;
      case 'useIframeShowMail':
        this.useIframeShowMail.set(value);
        break;
      case 'preferShowTextMail':
        this.preferShowTextMail.set(value);
        break;
      case 'globalTabplacement':
        this.globalTabplacement.set(value);
        break;
      case 'useSideMargin':
        this.useSideMargin.set(value);
        break;
      case 'useUTCDate':
        this.useUTCDate.set(value);
        break;
      case 'autoRefresh':
        this.autoRefresh.set(value);
        break;
      case 'configAutoRefreshInterval':
        this.configAutoRefreshInterval.set(value);
        break;
      case 'useSimpleIndex':
        this.useSimpleIndex.set(value);
        break;
    }
  }

  // Trigger refresh for Gmail inbox
  triggerRefresh() {
    this.refreshTrigger.update(v => v + 1);
  }

  // Save address to list
  addSavedAddress(address: string, jwt: string) {
    const addresses = this.savedAddresses();
    // Remove if already exists (to update jwt)
    const filtered = addresses.filter(a => a.address !== address);
    const updated = [...filtered, { address, jwt }];
    this.savedAddresses.set(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
  }

  // Remove address from list
  removeSavedAddress(address: string) {
    const updated = this.savedAddresses().filter(a => a.address !== address);
    this.savedAddresses.set(updated);
    localStorage.setItem('savedAddresses', JSON.stringify(updated));
  }

  // Switch to a saved address
  switchToAddress(address: string) {
    const saved = this.savedAddresses().find(a => a.address === address);
    if (saved) {
      this.setJwt(saved.jwt);
      return true;
    }
    return false;
  }

  // Logout
  logout() {
    this.setJwt('');
    this.setUserJwt('');
    this.settings.set({
      fetched: false,
      send_balance: 0,
      address: '',
      auto_reply: {
        subject: '',
        message: '',
        enabled: false,
        source_prefix: '',
        name: '',
      },
    });
  }
}
