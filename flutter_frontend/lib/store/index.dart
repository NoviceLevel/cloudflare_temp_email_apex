import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/index.dart';

class AppState extends ChangeNotifier {
  // Theme
  bool _isDark = false;
  bool get isDark => _isDark;

  // Loading
  bool _loading = false;
  bool get loading => _loading;

  // Auth
  String _jwt = '';
  String _auth = '';
  String _adminAuth = '';
  String _userJwt = '';
  String _addressPassword = '';
  
  String get jwt => _jwt;
  String get auth => _auth;
  String get adminAuth => _adminAuth;
  String get userJwt => _userJwt;
  String get addressPassword => _addressPassword;

  // Settings
  OpenSettings _openSettings = OpenSettings();
  Settings _settings = Settings();
  UserOpenSettings _userOpenSettings = UserOpenSettings();
  UserSettings _userSettings = UserSettings();
  
  OpenSettings get openSettings => _openSettings;
  Settings get settings => _settings;
  UserOpenSettings get userOpenSettings => _userOpenSettings;
  UserSettings get userSettings => _userSettings;

  // UI State
  String _locale = 'zh';
  String _indexTab = 'mailbox';
  String _adminTab = 'account';
  String _userTab = 'address_management';
  bool _showAuth = false;
  bool _showAdminAuth = false;
  bool _showAddressCredential = false;
  bool _useSimpleIndex = false;
  String _announcement = '';
  bool _autoRefresh = false;
  int _autoRefreshInterval = 60;
  bool _useIframeShowMail = false;
  bool _preferShowTextMail = false;
  bool _useUTCDate = false;
  double _mailboxSplitSize = 0.25;
  String _globalTabPlacement = 'top';
  bool _useSideMargin = true;

  String get locale => _locale;
  String get indexTab => _indexTab;
  String get adminTab => _adminTab;
  String get userTab => _userTab;
  bool get showAuth => _showAuth;
  bool get showAdminAuth => _showAdminAuth;
  bool get showAddressCredential => _showAddressCredential;
  bool get useSimpleIndex => _useSimpleIndex;
  String get announcement => _announcement;
  bool get autoRefresh => _autoRefresh;
  int get autoRefreshInterval => _autoRefreshInterval;
  bool get useIframeShowMail => _useIframeShowMail;
  bool get preferShowTextMail => _preferShowTextMail;
  bool get useUTCDate => _useUTCDate;
  double get mailboxSplitSize => _mailboxSplitSize;
  String get globalTabPlacement => _globalTabPlacement;
  bool get useSideMargin => _useSideMargin;

  // Send Mail Model
  SendMailModel _sendMailModel = SendMailModel();
  SendMailModel get sendMailModel => _sendMailModel;

  // Telegram
  bool _isTelegram = false;
  bool get isTelegram => _isTelegram;

  AppState() {
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getBool('isDark') ?? false;
    _jwt = prefs.getString('jwt') ?? '';
    _auth = prefs.getString('auth') ?? '';
    _adminAuth = prefs.getString('adminAuth') ?? '';
    _userJwt = prefs.getString('userJwt') ?? '';
    _locale = prefs.getString('locale') ?? 'zh';
    _announcement = prefs.getString('announcement') ?? '';
    _useSimpleIndex = prefs.getBool('useSimpleIndex') ?? false;
    _autoRefresh = prefs.getBool('autoRefresh') ?? false;
    _autoRefreshInterval = prefs.getInt('autoRefreshInterval') ?? 60;
    _useIframeShowMail = prefs.getBool('useIframeShowMail') ?? false;
    _preferShowTextMail = prefs.getBool('preferShowTextMail') ?? false;
    _useUTCDate = prefs.getBool('useUTCDate') ?? false;
    _mailboxSplitSize = prefs.getDouble('mailboxSplitSize') ?? 0.25;
    _globalTabPlacement = prefs.getString('globalTabPlacement') ?? 'top';
    _useSideMargin = prefs.getBool('useSideMargin') ?? true;
    
    // Sync with API service
    Api.instance.setAuth(
      jwt: _jwt,
      auth: _auth,
      adminAuth: _adminAuth,
      userJwt: _userJwt,
      locale: _locale,
    );
    
    notifyListeners();
  }

  // Theme
  Future<void> toggleDark() async {
    _isDark = !_isDark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDark', _isDark);
    notifyListeners();
  }

  // Loading
  void setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }

  // Auth setters
  Future<void> setJwt(String value) async {
    _jwt = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt', value);
    Api.instance.setAuth(jwt: value);
    notifyListeners();
  }

  Future<void> setAuth(String value) async {
    _auth = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth', value);
    Api.instance.setAuth(auth: value);
    notifyListeners();
  }

  Future<void> setAdminAuth(String value) async {
    _adminAuth = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('adminAuth', value);
    Api.instance.setAuth(adminAuth: value);
    notifyListeners();
  }

  Future<void> setUserJwt(String value) async {
    _userJwt = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('userJwt', value);
    Api.instance.setAuth(userJwt: value);
    notifyListeners();
  }

  void setAddressPassword(String value) {
    _addressPassword = value;
    notifyListeners();
  }

  // Settings setters
  void setOpenSettings(dynamic value) {
    if (value is OpenSettings) {
      _openSettings = value;
    } else if (value is Map<String, dynamic>) {
      _openSettings = OpenSettings.fromJson(value);
    }
    notifyListeners();
  }

  void setSettings(dynamic value) {
    if (value is Settings) {
      _settings = value;
    } else if (value is Map<String, dynamic>) {
      _settings = Settings.fromJson(value);
    }
    notifyListeners();
  }

  void setUserOpenSettings(dynamic value) {
    if (value is UserOpenSettings) {
      _userOpenSettings = value;
    } else if (value is Map<String, dynamic>) {
      _userOpenSettings = UserOpenSettings.fromJson(value);
    }
    notifyListeners();
  }

  void setUserSettings(dynamic value) {
    if (value is UserSettings) {
      _userSettings = value;
    } else if (value is Map<String, dynamic>) {
      _userSettings = UserSettings.fromJson(value);
    }
    notifyListeners();
  }

  // OAuth2 session
  String _userOauth2SessionClientID = '';
  String _userOauth2SessionState = '';
  
  void setUserOauth2Session(String clientID, String state) {
    _userOauth2SessionClientID = clientID;
    _userOauth2SessionState = state;
    notifyListeners();
  }

  // UI State setters
  Future<void> setLocale(String value) async {
    _locale = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('locale', value);
    Api.instance.setAuth(locale: value);
    notifyListeners();
  }

  void setIndexTab(String value) {
    _indexTab = value;
    notifyListeners();
  }

  void setAdminTab(String value) {
    _adminTab = value;
    notifyListeners();
  }

  void setUserTab(String value) {
    _userTab = value;
    notifyListeners();
  }

  void setShowAuth(bool value) {
    _showAuth = value;
    notifyListeners();
  }

  void setShowAdminAuth(bool value) {
    _showAdminAuth = value;
    notifyListeners();
  }

  void setShowAddressCredential(bool value) {
    _showAddressCredential = value;
    notifyListeners();
  }

  Future<void> setUseSimpleIndex(bool value) async {
    _useSimpleIndex = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('useSimpleIndex', value);
    notifyListeners();
  }

  void setAnnouncement(String value) {
    _announcement = value;
    notifyListeners();
  }

  Future<void> setAutoRefresh(bool value) async {
    _autoRefresh = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('autoRefresh', value);
    notifyListeners();
  }

  Future<void> setAutoRefreshInterval(int value) async {
    _autoRefreshInterval = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('autoRefreshInterval', value);
    notifyListeners();
  }

  Future<void> setUseIframeShowMail(bool value) async {
    _useIframeShowMail = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('useIframeShowMail', value);
    notifyListeners();
  }

  Future<void> setPreferShowTextMail(bool value) async {
    _preferShowTextMail = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('preferShowTextMail', value);
    notifyListeners();
  }

  Future<void> setUseUTCDate(bool value) async {
    _useUTCDate = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('useUTCDate', value);
    notifyListeners();
  }

  Future<void> setMailboxSplitSize(double value) async {
    _mailboxSplitSize = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('mailboxSplitSize', value);
    notifyListeners();
  }

  Future<void> setGlobalTabPlacement(String value) async {
    _globalTabPlacement = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('globalTabPlacement', value);
    notifyListeners();
  }

  Future<void> setUseSideMargin(bool value) async {
    _useSideMargin = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('useSideMargin', value);
    notifyListeners();
  }

  void setSendMailModel(SendMailModel value) {
    _sendMailModel = value;
    notifyListeners();
  }

  // Computed
  bool get showAdminPage =>
      _adminAuth.isNotEmpty ||
      _userSettings.isAdmin ||
      _openSettings.disableAdminPasswordCheck;

  // Actions
  Future<void> logout() async {
    await setJwt('');
    _settings = Settings();
    notifyListeners();
  }
}

// Models
class OpenSettings {
  final bool fetched;
  final String title;
  final String prefix;
  final String addressRegex;
  final int minAddressLen;
  final int maxAddressLen;
  final bool needAuth;
  final List<String> defaultDomains;
  final List<DomainOption> domains;
  final String adminContact;
  final bool enableUserCreateEmail;
  final bool disableAnonymousUserCreateEmail;
  final bool disableCustomAddressName;
  final bool enableUserDeleteEmail;
  final bool enableAutoReply;
  final bool enableIndexAbout;
  final String copyright;
  final String cfTurnstileSiteKey;
  final bool enableWebhook;
  final bool isS3Enabled;
  final bool showGithub;
  final bool disableAdminPasswordCheck;
  final bool enableAddressPassword;
  final String? announcement;
  final bool alwaysShowAnnouncement;

  OpenSettings({
    this.fetched = false,
    this.title = '',
    this.prefix = '',
    this.addressRegex = '',
    this.minAddressLen = 1,
    this.maxAddressLen = 30,
    this.needAuth = false,
    this.defaultDomains = const [],
    this.domains = const [],
    this.adminContact = '',
    this.enableUserCreateEmail = false,
    this.disableAnonymousUserCreateEmail = false,
    this.disableCustomAddressName = false,
    this.enableUserDeleteEmail = false,
    this.enableAutoReply = false,
    this.enableIndexAbout = false,
    this.copyright = 'NoviceLevel',
    this.cfTurnstileSiteKey = '',
    this.enableWebhook = false,
    this.isS3Enabled = false,
    this.showGithub = true,
    this.disableAdminPasswordCheck = false,
    this.enableAddressPassword = false,
    this.announcement,
    this.alwaysShowAnnouncement = false,
  });

  factory OpenSettings.fromJson(Map<String, dynamic> json) {
    final domainLabels = (json['domainLabels'] as List?)?.cast<String>() ?? [];
    final domainValues = (json['domains'] as List?)?.cast<String>() ?? [];
    
    return OpenSettings(
      fetched: true,
      title: json['title'] ?? '',
      prefix: json['prefix'] ?? '',
      addressRegex: json['addressRegex'] ?? '',
      minAddressLen: json['minAddressLen'] ?? 1,
      maxAddressLen: json['maxAddressLen'] ?? 30,
      needAuth: json['needAuth'] ?? false,
      defaultDomains: (json['defaultDomains'] as List?)?.cast<String>() ?? [],
      domains: domainValues.asMap().entries.map((e) {
        return DomainOption(
          label: domainLabels.length > e.key ? domainLabels[e.key] : e.value,
          value: e.value,
        );
      }).toList(),
      adminContact: json['adminContact'] ?? '',
      enableUserCreateEmail: json['enableUserCreateEmail'] ?? false,
      disableAnonymousUserCreateEmail: json['disableAnonymousUserCreateEmail'] ?? false,
      disableCustomAddressName: json['disableCustomAddressName'] ?? false,
      enableUserDeleteEmail: json['enableUserDeleteEmail'] ?? false,
      enableAutoReply: json['enableAutoReply'] ?? false,
      enableIndexAbout: json['enableIndexAbout'] ?? false,
      copyright: json['copyright'] ?? 'NoviceLevel',
      cfTurnstileSiteKey: json['cfTurnstileSiteKey'] ?? '',
      enableWebhook: json['enableWebhook'] ?? false,
      isS3Enabled: json['isS3Enabled'] ?? false,
      showGithub: json['showGithub'] ?? true,
      disableAdminPasswordCheck: json['disableAdminPasswordCheck'] ?? false,
      enableAddressPassword: json['enableAddressPassword'] ?? false,
      announcement: json['announcement'],
      alwaysShowAnnouncement: json['alwaysShowAnnouncement'] ?? false,
    );
  }
}

class DomainOption {
  final String label;
  final String value;
  DomainOption({required this.label, required this.value});
}

class Settings {
  final bool fetched;
  final String address;
  final int sendBalance;
  final AutoReply autoReply;

  Settings({
    this.fetched = false,
    this.address = '',
    this.sendBalance = 0,
    AutoReply? autoReply,
  }) : autoReply = autoReply ?? AutoReply();

  factory Settings.fromJson(Map<String, dynamic> json) {
    return Settings(
      fetched: true,
      address: json['address'] ?? '',
      sendBalance: json['send_balance'] ?? 0,
      autoReply: json['auto_reply'] != null
          ? AutoReply.fromJson(json['auto_reply'])
          : AutoReply(),
    );
  }
}

class AutoReply {
  final String subject;
  final String message;
  final bool enabled;
  final String sourcePrefix;
  final String name;

  AutoReply({
    this.subject = '',
    this.message = '',
    this.enabled = false,
    this.sourcePrefix = '',
    this.name = '',
  });

  factory AutoReply.fromJson(Map<String, dynamic> json) {
    return AutoReply(
      subject: json['subject'] ?? '',
      message: json['message'] ?? '',
      enabled: json['enabled'] ?? false,
      sourcePrefix: json['source_prefix'] ?? '',
      name: json['name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'subject': subject,
    'message': message,
    'enabled': enabled,
    'source_prefix': sourcePrefix,
    'name': name,
  };
}

class UserOpenSettings {
  final bool fetched;
  final bool enable;
  final bool enableMailVerify;
  final List<OAuth2Client> oauth2ClientIDs;

  UserOpenSettings({
    this.fetched = false,
    this.enable = false,
    this.enableMailVerify = false,
    this.oauth2ClientIDs = const [],
  });

  factory UserOpenSettings.fromJson(Map<String, dynamic> json) {
    return UserOpenSettings(
      fetched: true,
      enable: json['enable'] ?? false,
      enableMailVerify: json['enableMailVerify'] ?? false,
      oauth2ClientIDs: (json['oauth2ClientIDs'] as List?)
          ?.map((e) => OAuth2Client.fromJson(e))
          .toList() ?? [],
    );
  }
}

class OAuth2Client {
  final String clientID;
  final String name;

  OAuth2Client({required this.clientID, required this.name});

  factory OAuth2Client.fromJson(Map<String, dynamic> json) {
    return OAuth2Client(
      clientID: json['clientID'] ?? '',
      name: json['name'] ?? '',
    );
  }
}

class UserSettings {
  final bool fetched;
  final String userEmail;
  final int userId;
  final bool isAdmin;
  final String? accessToken;
  final String? newUserToken;
  final UserRole? userRole;

  UserSettings({
    this.fetched = false,
    this.userEmail = '',
    this.userId = 0,
    this.isAdmin = false,
    this.accessToken,
    this.newUserToken,
    this.userRole,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) {
    return UserSettings(
      fetched: true,
      userEmail: json['user_email'] ?? '',
      userId: json['user_id'] ?? 0,
      isAdmin: json['is_admin'] ?? false,
      accessToken: json['access_token'],
      newUserToken: json['new_user_token'],
      userRole: json['user_role'] != null ? UserRole.fromJson(json['user_role']) : null,
    );
  }
}

class UserRole {
  final List<String>? domains;
  final String role;
  final String? prefix;

  UserRole({this.domains, required this.role, this.prefix});

  factory UserRole.fromJson(Map<String, dynamic> json) {
    return UserRole(
      domains: (json['domains'] as List?)?.cast<String>(),
      role: json['role'] ?? '',
      prefix: json['prefix'],
    );
  }
}

class SendMailModel {
  String fromName;
  String toName;
  String toMail;
  String subject;
  String contentType;
  String content;

  SendMailModel({
    this.fromName = '',
    this.toName = '',
    this.toMail = '',
    this.subject = '',
    this.contentType = 'text',
    this.content = '',
  });
}
