import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class UserSettingsPageView extends StatefulWidget {
  const UserSettingsPageView({super.key});

  @override
  State<UserSettingsPageView> createState() => _UserSettingsPageViewState();
}

class _UserSettingsPageViewState extends State<UserSettingsPageView> {
  bool _loading = false;
  bool _showLogout = false;
  bool _showCreatePasskey = false;
  bool _showPasskeyList = false;
  List<Map<String, dynamic>> _passkeyData = [];
  String _passkeyName = '';

  final _passkeyNameController = TextEditingController();

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'logout': isZh ? '退出登录' : 'Logout',
      'logoutConfirm': isZh ? '确定要退出登录吗？' : 'Are you sure you want to logout?',
      'passwordTip': isZh 
          ? '服务器只会接收到密码的哈希值，不会接收到明文密码，因此无法查看或者找回您的密码' 
          : 'The server will only receive the hash value of the password',
      'createPasskey': isZh ? '创建 Passkey' : 'Create Passkey',
      'showPasskeyList': isZh ? '查看 Passkey 列表' : 'Show Passkey List',
      'passkeyCreated': isZh ? 'Passkey 创建成功' : 'Passkey created successfully',
      'passkeyNamePlaceholder': isZh ? '请输入 Passkey 名称或者留空自动生成' : 'Please enter the passkey name',
      'renamePasskey': isZh ? '重命名 Passkey' : 'Rename Passkey',
      'deletePasskey': isZh ? '删除 Passkey' : 'Delete Passkey',
      'passkeyName': isZh ? 'Passkey 名称' : 'Passkey Name',
      'createdAt': isZh ? '创建时间' : 'Created At',
      'updatedAt': isZh ? '更新时间' : 'Updated At',
      'actions': isZh ? '操作' : 'Actions',
      'cancel': isZh ? '取消' : 'Cancel',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _logout() async {
    final appState = context.read<AppState>();
    await appState.setUserJwt('');
    _showMessage(_t['logout']!);
  }

  Future<void> _fetchPasskeyList() async {
    try {
      final res = await Api.instance.fetch('/user_api/passkey');
      if (res != null) {
        setState(() => _passkeyData = List<Map<String, dynamic>>.from(res));
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _createPasskey() async {
    _showMessage('Passkey not supported in this demo', isError: true);
    setState(() => _showCreatePasskey = false);
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final userEmail = appState.userSettings.userEmail;

    if (userEmail.isEmpty) {
      return const SizedBox.shrink();
    }

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() => _showPasskeyList = true);
                      _fetchPasskeyList();
                    },
                    child: Text(_t['showPasskeyList']!),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => setState(() => _showCreatePasskey = true),
                    child: Text(_t['createPasskey']!),
                  ),
                ),
                const SizedBox(height: 16),
                Card(
                  color: Colors.blue.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const Icon(Icons.info, color: Colors.blue),
                        const SizedBox(width: 8),
                        Expanded(child: Text(_t['passwordTip']!)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => setState(() => _showLogout = true),
                    child: Text(_t['logout']!),
                  ),
                ),
                if (_showLogout) _buildLogoutDialog(),
                if (_showCreatePasskey) _buildCreatePasskeyDialog(),
                if (_showPasskeyList) _buildPasskeyListDialog(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogoutDialog() {
    return AlertDialog(
      title: Text(_t['logout']!),
      content: Text(_t['logoutConfirm']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showLogout = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: _logout,
          style: FilledButton.styleFrom(backgroundColor: Colors.orange),
          child: Text(_t['logout']!),
        ),
      ],
    );
  }

  Widget _buildCreatePasskeyDialog() {
    return AlertDialog(
      title: Text(_t['createPasskey']!),
      content: TextField(
        controller: _passkeyNameController,
        decoration: InputDecoration(
          hintText: _t['passkeyNamePlaceholder'],
          border: const OutlineInputBorder(),
        ),
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showCreatePasskey = false), child: Text(_t['cancel']!)),
        FilledButton(onPressed: _createPasskey, child: Text(_t['createPasskey']!)),
      ],
    );
  }

  Widget _buildPasskeyListDialog() {
    return AlertDialog(
      title: Text(_t['showPasskeyList']!),
      content: SizedBox(
        width: 600,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columns: [
              const DataColumn(label: Text('Passkey ID')),
              DataColumn(label: Text(_t['passkeyName']!)),
              DataColumn(label: Text(_t['createdAt']!)),
              DataColumn(label: Text(_t['updatedAt']!)),
              DataColumn(label: Text(_t['actions']!)),
            ],
            rows: _passkeyData.map((row) => DataRow(cells: [
              DataCell(Text(row['passkey_id']?.toString() ?? '')),
              DataCell(Text(row['passkey_name'] ?? '')),
              DataCell(Text(row['created_at'] ?? '')),
              DataCell(Text(row['updated_at'] ?? '')),
              DataCell(Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextButton(onPressed: () {}, child: Text(_t['renamePasskey']!)),
                  TextButton(
                    onPressed: () {},
                    child: Text(_t['deletePasskey']!, style: const TextStyle(color: Colors.red)),
                  ),
                ],
              )),
            ])).toList(),
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showPasskeyList = false), child: Text(_t['cancel']!)),
      ],
    );
  }
}
