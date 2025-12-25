import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class CreateAccountView extends StatefulWidget {
  const CreateAccountView({super.key});

  @override
  State<CreateAccountView> createState() => _CreateAccountViewState();
}

class _CreateAccountViewState extends State<CreateAccountView> {
  bool _loading = false;
  bool _enablePrefix = true;
  String _emailName = '';
  String _emailDomain = '';
  List<String> _domainOptions = [];
  
  String _resultJwt = '';
  String _addressPassword = '';
  String _createdAddress = '';
  bool _showResultDialog = false;

  final _emailNameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDomains();
  }

  void _loadDomains() {
    final appState = context.read<AppState>();
    final domains = appState.openSettings.domains;
    _domainOptions = domains.map<String>((d) => d.value).toList();
    if (_domainOptions.isNotEmpty) {
      _emailDomain = _domainOptions.first;
    }
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'address': isZh ? '地址' : 'Address',
      'enablePrefix': isZh ? '是否启用前缀' : 'If enable Prefix',
      'createNewEmail': isZh ? '创建新邮箱' : 'Create New Email',
      'fillInAllFields': isZh ? '请填写完整信息' : 'Please fill in all fields',
      'successTip': isZh ? '创建成功' : 'Success Created',
      'addressCredential': isZh ? '邮箱地址凭证' : 'Mail Address Credential',
      'addressCredentialTip': isZh ? '请复制邮箱地址凭证，你可以使用它登录你的邮箱。' : 'Please copy the Mail Address Credential.',
      'addressPassword': isZh ? '地址密码' : 'Address Password',
      'linkWithCredential': isZh ? '打开即可自动登录邮箱的链接' : 'Open to auto login email link',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _createEmail() async {
    if (_emailNameController.text.isEmpty || _emailDomain.isEmpty) {
      _showMessage(_t['fillInAllFields']!, isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await Api.adminFetch('/admin/new_address', method: 'POST', body: {
        'enablePrefix': _enablePrefix,
        'name': _emailNameController.text,
        'domain': _emailDomain,
      });
      if (res != null) {
        setState(() {
          _resultJwt = res['jwt'] ?? '';
          _addressPassword = res['password'] ?? '';
          _createdAddress = res['address'] ?? '';
          _showResultDialog = true;
        });
        _showMessage(_t['successTip']!);
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final prefix = appState.openSettings.prefix;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (prefix.isNotEmpty)
                    SwitchListTile(
                      title: Text(_t['enablePrefix']!),
                      value: _enablePrefix,
                      onChanged: (v) => setState(() => _enablePrefix = v),
                    ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      if (_enablePrefix && prefix.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Text(prefix, style: Theme.of(context).textTheme.bodyLarge),
                        ),
                      Expanded(
                        child: TextField(
                          controller: _emailNameController,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8),
                        child: Text('@'),
                      ),
                      SizedBox(
                        width: 200,
                        child: DropdownButtonFormField<String>(
                          value: _emailDomain.isNotEmpty ? _emailDomain : null,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: _domainOptions.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                          onChanged: (v) => setState(() => _emailDomain = v ?? ''),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: _loading ? null : _createEmail,
                      child: _loading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : Text(_t['createNewEmail']!),
                    ),
                  ),
                  if (_showResultDialog) _buildResultDialog(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildResultDialog() {
    return AlertDialog(
      title: Text(_t['addressCredential']!),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_t['addressCredentialTip']!),
            const SizedBox(height: 16),
            Card(
              color: Colors.grey.shade100,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: SelectableText(_resultJwt, style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            if (_addressPassword.isNotEmpty) ...[
              const SizedBox(height: 16),
              Card(
                color: Colors.grey.shade100,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_createdAddress, style: const TextStyle(fontWeight: FontWeight.bold)),
                      Text('${_t['addressPassword']}: $_addressPassword', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            ExpansionTile(
              title: Text(_t['linkWithCredential']!),
              children: [
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: SelectableText(
                    '${Uri.base.origin}/?jwt=$_resultJwt',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => setState(() => _showResultDialog = false),
          child: const Text('OK'),
        ),
      ],
    );
  }
}
