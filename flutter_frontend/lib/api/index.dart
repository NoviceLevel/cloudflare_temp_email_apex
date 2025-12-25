import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../store/index.dart';

class Api {
  static final Api instance = Api._internal();
  factory Api() => instance;
  
  late final Dio _dio;
  String _jwt = '';
  String _auth = '';
  String _adminAuth = '';
  String _userJwt = '';
  String _userAccessToken = '';
  String _locale = 'zh';
  
  Api._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: kDebugMode ? 'http://127.0.0.1:8787' : '',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));
  }

  void setAuth({String? jwt, String? auth, String? adminAuth, String? userJwt, String? userAccessToken, String? locale}) {
    if (jwt != null) _jwt = jwt;
    if (auth != null) _auth = auth;
    if (adminAuth != null) _adminAuth = adminAuth;
    if (userJwt != null) _userJwt = userJwt;
    if (userAccessToken != null) _userAccessToken = userAccessToken;
    if (locale != null) _locale = locale;
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'x-lang': _locale,
    'x-custom-auth': _auth,
    'x-admin-auth': _adminAuth,
    if (_jwt.isNotEmpty) 'Authorization': 'Bearer $_jwt',
    if (_userJwt.isNotEmpty) 'x-user-token': _userJwt,
    if (_userAccessToken.isNotEmpty) 'x-user-access-token': _userAccessToken,
  };

  Future<dynamic> fetch(String path, {String method = 'GET', dynamic body}) async {
    try {
      final response = await _dio.request(
        path,
        data: body,
        options: Options(method: method, headers: _headers),
      );
      return response.data;
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception('[${e.response?.statusCode}]: ${e.response?.data}');
      }
      throw Exception(e.message);
    }
  }

  // ==================== Open API ====================
  Future<OpenSettings> getOpenSettings() async {
    final data = await fetch('/open_api/settings');
    return OpenSettings.fromJson(data);
  }

  // ==================== Address API ====================
  Future<Settings> getSettings() async {
    if (_jwt.isEmpty) return Settings();
    final data = await fetch('/api/settings');
    return Settings.fromJson(data);
  }

  Future<Map<String, dynamic>> newAddress({
    required String name, 
    required String domain, 
    String? password,
    String? cfToken,
  }) async {
    return await fetch('/api/new_address', method: 'POST', body: {
      'name': name,
      'domain': domain,
      if (password != null && password.isNotEmpty) 'password': password,
      if (cfToken != null) 'cf_token': cfToken,
    });
  }

  Future<void> deleteAddress() async {
    await fetch('/api/delete_address', method: 'DELETE');
  }

  // ==================== Mail API ====================
  Future<MailListResult> getMails({int limit = 20, int offset = 0}) async {
    final data = await fetch('/api/mails?limit=$limit&offset=$offset');
    return MailListResult.fromJson(data);
  }

  Future<Email> getMail(int id) async {
    final data = await fetch('/api/mail/$id');
    return Email.fromJson(data);
  }

  Future<void> deleteMail(int id) async {
    await fetch('/api/mails/$id', method: 'DELETE');
  }

  // ==================== Sendbox API ====================
  Future<MailListResult> getSendbox({int limit = 20, int offset = 0}) async {
    final data = await fetch('/api/sendbox?limit=$limit&offset=$offset');
    return MailListResult.fromJson(data);
  }

  Future<void> deleteSendboxMail(int id) async {
    await fetch('/api/sendbox/$id', method: 'DELETE');
  }

  // ==================== Send Mail API ====================
  Future<void> sendMail({
    required String toMail,
    required String subject,
    required String content,
    String? toName,
    String? fromName,
    bool isHtml = false,
  }) async {
    await fetch('/api/send_mail', method: 'POST', body: {
      'to_mail': toMail,
      'to_name': toName ?? '',
      'from_name': fromName ?? '',
      'subject': subject,
      'is_html': isHtml,
      'content': content,
    });
  }

  // ==================== Auto Reply API ====================
  Future<void> updateAutoReply(AutoReply autoReply) async {
    await fetch('/api/auto_reply', method: 'POST', body: autoReply.toJson());
  }

  // ==================== User API ====================
  Future<UserOpenSettings> getUserOpenSettings() async {
    final data = await fetch('/user_api/open_settings');
    return UserOpenSettings.fromJson(data);
  }

  Future<UserSettings> getUserSettings() async {
    if (_userJwt.isEmpty) return UserSettings();
    final data = await fetch('/user_api/settings');
    return UserSettings.fromJson(data);
  }

  Future<void> bindUserAddress() async {
    await fetch('/user_api/bind_address', method: 'POST');
  }

  Future<List<UserAddress>> getUserAddresses() async {
    final data = await fetch('/user_api/addresses');
    return (data as List).map((e) => UserAddress.fromJson(e)).toList();
  }

  Future<void> deleteUserAddress(int id) async {
    await fetch('/user_api/addresses/$id', method: 'DELETE');
  }

  // ==================== Admin API ====================
  static Future<dynamic> adminFetch(String path, {String method = 'GET', dynamic body}) async {
    return Api.instance.fetch(path, method: method, body: body);
  }

  static Future<String?> adminShowAddressCredential(int id) async {
    final data = await Api.instance.fetch('/admin/show_password/$id');
    return data?['jwt'];
  }

  static Future<void> adminDeleteAddress(int id) async {
    await Api.instance.fetch('/admin/delete_address/$id', method: 'DELETE');
  }

  Future<List<AdminAddress>> adminGetAddresses({int limit = 20, int offset = 0, String? query}) async {
    String url = '/admin/address?limit=$limit&offset=$offset';
    if (query != null && query.isNotEmpty) url += '&query=$query';
    final data = await fetch(url);
    return (data['results'] as List).map((e) => AdminAddress.fromJson(e)).toList();
  }

  Future<AdminStatistics> adminGetStatistics() async {
    final data = await fetch('/admin/statistics');
    return AdminStatistics.fromJson(data);
  }

  Future<void> adminCleanup({int? days}) async {
    await fetch('/admin/cleanup', method: 'POST', body: {
      if (days != null) 'days': days,
    });
  }
}

// ==================== Models ====================
class MailListResult {
  final List<Email> results;
  final int count;

  MailListResult({required this.results, required this.count});

  factory MailListResult.fromJson(Map<String, dynamic> json) {
    final results = (json['results'] as List?)?.map((e) => Email.fromJson(e)).toList() ?? [];
    return MailListResult(results: results, count: json['count'] ?? 0);
  }
}

class Email {
  final int id;
  final String address;
  final String subject;
  final String source;
  final String? text;
  final String? message;
  final String? raw;
  final DateTime createdAt;
  final bool isRead;
  final List<Attachment> attachments;
  final Map<String, dynamic>? metadata;
  bool checked;

  Email({
    required this.id,
    required this.address,
    required this.subject,
    required this.source,
    this.text,
    this.message,
    this.raw,
    required this.createdAt,
    this.isRead = false,
    this.attachments = const [],
    this.metadata,
    this.checked = false,
  });

  factory Email.fromJson(Map<String, dynamic> json) {
    return Email(
      id: json['id'] ?? 0,
      address: json['address'] ?? '',
      subject: json['subject'] ?? '(无主题)',
      source: json['source'] ?? '',
      text: json['text'],
      message: json['message'],
      raw: json['raw'],
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      isRead: json['is_read'] == 1 || json['is_read'] == true,
      attachments: (json['attachments'] as List?)?.map((e) => Attachment.fromJson(e)).toList() ?? [],
      metadata: json['metadata'],
    );
  }
}

class Attachment {
  final String filename;
  final int size;
  final String? url;
  final String? blob;

  Attachment({required this.filename, required this.size, this.url, this.blob});

  factory Attachment.fromJson(Map<String, dynamic> json) {
    return Attachment(
      filename: json['filename'] ?? '',
      size: json['size'] ?? 0,
      url: json['url'],
      blob: json['blob'],
    );
  }
}

class UserAddress {
  final int id;
  final String address;
  final DateTime createdAt;

  UserAddress({required this.id, required this.address, required this.createdAt});

  factory UserAddress.fromJson(Map<String, dynamic> json) {
    return UserAddress(
      id: json['id'] ?? 0,
      address: json['address'] ?? '',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
    );
  }
}

class AdminAddress {
  final int id;
  final String name;
  final String address;
  final DateTime createdAt;
  final int mailCount;

  AdminAddress({
    required this.id,
    required this.name,
    required this.address,
    required this.createdAt,
    required this.mailCount,
  });

  factory AdminAddress.fromJson(Map<String, dynamic> json) {
    return AdminAddress(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      address: json['address'] ?? '',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      mailCount: json['mail_count'] ?? 0,
    );
  }
}

class AdminStatistics {
  final int addressCount;
  final int mailCount;
  final int sendMailCount;

  AdminStatistics({
    required this.addressCount,
    required this.mailCount,
    required this.sendMailCount,
  });

  factory AdminStatistics.fromJson(Map<String, dynamic> json) {
    return AdminStatistics(
      addressCount: json['address_count'] ?? 0,
      mailCount: json['mail_count'] ?? 0,
      sendMailCount: json['send_mail_count'] ?? 0,
    );
  }
}
