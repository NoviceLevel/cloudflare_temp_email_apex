import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class UserOauth2SettingsView extends StatefulWidget {
  const UserOauth2SettingsView({super.key});

  @override
  State<UserOauth2SettingsView> createState() => _UserOauth2SettingsViewState();
}

class _UserOauth2SettingsViewState extends State<UserOauth2SettingsView> {
  bool _loading = false;
  List<Map<String, dynamic>> _settings = [];
  bool _showAddDialog = false;
  String _newName = '';
  String _newType = 'custom';
  int? _deleteIndex;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'save': isZh ? '保存' : 'Save',
      'delete': isZh ? '删除' : 'Delete',
      'successTip': isZh ? '保存成功' : 'Save Success',
      'enable': isZh ? '启用' : 'Enable',
      'addOauth2': isZh ? '添加 Oauth2' : 'Add Oauth2',
      'name': isZh ? '名称' : 'Name',
      'oauth2Type': isZh ? 'Oauth2 类型' : 'Oauth2 Type',
      'tip': isZh ? '第三方登录会自动使用用户邮箱注册账号(邮箱相同将视为同一账号)' : 'Third-party login will automatically use the user\'s email to register an account',
      'cancel': isZh ? '取消' : 'Cancel',
      'confirm': isZh ? '确认' : 'Confirm',
      'mailAllowList': isZh ? '邮件地址白名单' : 'Mail Address Allow List',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/user_oauth2_settings');
      if (res != null) {
        setState(() => _settings = List<Map<String, dynamic>>.from(res));
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/user_oauth2_settings', method: 'POST', body: _settings);
      _showMessage(_t['successTip']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  void _addNewOauth2() {
    String authorizationURL = '';
    String accessTokenURL = '';
    String accessTokenFormat = 'json';
    String userInfoURL = '';
    String userEmailKey = 'email';
    String scope = '';

    switch (_newType) {
      case 'github':
        authorizationURL = 'https://github.com/login/oauth/authorize';
        accessTokenURL = 'https://github.com/login/oauth/access_token';
        userInfoURL = 'https://api.github.com/user';
        scope = 'user:email';
        break;
      case 'authentik':
        authorizationURL = 'https://youdomain/application/o/authorize/';
        accessTokenURL = 'https://youdomain/application/o/token/';
        accessTokenFormat = 'urlencoded';
        userInfoURL = 'https://youdomain/application/o/userinfo/';
        scope = 'email openid';
        break;
    }

    setState(() {
      _settings.add({
        'name': _newName,
        'clientID': '',
        'clientSecret': '',
        'authorizationURL': authorizationURL,
        'accessTokenURL': accessTokenURL,
        'accessTokenFormat': accessTokenFormat,
        'userInfoURL': userInfoURL,
        'userEmailKey': userEmailKey,
        'redirectURL': '${Uri.base.origin}/user/oauth2/callback',
        'logoutURL': '',
        'scope': scope,
        'enableMailAllowList': false,
        'mailAllowList': [],
      });
      _newName = '';
      _showAddDialog = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Column(
            children: [
              Card(
                color: Colors.orange.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.warning, color: Colors.orange),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_t['tip']!)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () => setState(() => _showAddDialog = true),
                    child: Text(_t['addOauth2']!),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: _loading ? null : _save,
                    child: _loading
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(_t['save']!),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ..._settings.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: ExpansionTile(
                    title: Row(
                      children: [
                        Expanded(child: Text(item['name'] ?? '')),
                        TextButton(
                          onPressed: () => setState(() => _deleteIndex = index),
                          child: Text(_t['delete']!, style: const TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _buildTextField('Name', item, 'name'),
                            _buildTextField('Client ID', item, 'clientID'),
                            _buildTextField('Client Secret', item, 'clientSecret', obscure: true),
                            _buildTextField('Authorization URL', item, 'authorizationURL'),
                            _buildTextField('Access Token URL', item, 'accessTokenURL'),
                            _buildTextField('User Info URL', item, 'userInfoURL'),
                            _buildTextField('User Email Key', item, 'userEmailKey'),
                            _buildTextField('Redirect URL', item, 'redirectURL'),
                            _buildTextField('Scope', item, 'scope'),
                            CheckboxListTile(
                              title: Text(_t['enable']!),
                              value: item['enableMailAllowList'] ?? false,
                              onChanged: (v) => setState(() => item['enableMailAllowList'] = v),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
              if (_showAddDialog) _buildAddDialog(),
              if (_deleteIndex != null) _buildDeleteDialog(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, Map<String, dynamic> item, String key, {bool obscure = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: TextEditingController(text: item[key]?.toString() ?? ''),
        obscureText: obscure,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder(), isDense: true),
        onChanged: (v) => item[key] = v,
      ),
    );
  }

  Widget _buildAddDialog() {
    return AlertDialog(
      title: Text(_t['addOauth2']!),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            decoration: InputDecoration(labelText: _t['name'], border: const OutlineInputBorder()),
            onChanged: (v) => _newName = v,
          ),
          const SizedBox(height: 16),
          Text(_t['oauth2Type']!),
          const SizedBox(height: 8),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'github', label: Text('Github')),
              ButtonSegment(value: 'authentik', label: Text('Authentik')),
              ButtonSegment(value: 'custom', label: Text('Custom')),
            ],
            selected: {_newType},
            onSelectionChanged: (v) => setState(() => _newType = v.first),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showAddDialog = false), child: Text(_t['cancel']!)),
        FilledButton(onPressed: _addNewOauth2, child: Text(_t['addOauth2']!)),
      ],
    );
  }

  Widget _buildDeleteDialog() {
    return AlertDialog(
      title: Text(_t['delete']!),
      content: Text('${_t['delete']}?'),
      actions: [
        TextButton(onPressed: () => setState(() => _deleteIndex = null), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: () {
            setState(() {
              _settings.removeAt(_deleteIndex!);
              _deleteIndex = null;
            });
          },
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: Text(_t['confirm']!),
        ),
      ],
    );
  }
}
