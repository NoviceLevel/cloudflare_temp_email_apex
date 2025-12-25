import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class UserSettingsView extends StatefulWidget {
  const UserSettingsView({super.key});

  @override
  State<UserSettingsView> createState() => _UserSettingsViewState();
}

class _UserSettingsViewState extends State<UserSettingsView> {
  bool _loading = false;
  bool _enable = false;
  bool _enableMailVerify = false;
  String _verifyMailSender = '';
  bool _enableMailAllowList = false;
  List<String> _mailAllowList = [];
  int _maxAddressCount = 5;

  final _verifyMailSenderController = TextEditingController();
  final _mailAllowListController = TextEditingController();
  final _maxAddressCountController = TextEditingController();

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
      'successTip': isZh ? '保存成功' : 'Save Success',
      'enable': isZh ? '启用' : 'Enable',
      'enableUserRegister': isZh ? '允许用户注册' : 'Allow User Register',
      'enableMailVerify': isZh ? '启用邮件验证(发送地址必须是系统中能有余额且能正常发送邮件的地址)' : 'Enable Mail Verify',
      'verifyMailSender': isZh ? '验证邮件发送地址' : 'Verify Mail Sender',
      'enableMailAllowList': isZh ? '启用邮件地址白名单(可手动输入, 回车增加)' : 'Enable Mail Address Allow List',
      'mailAllowList': isZh ? '邮件地址白名单' : 'Mail Address Allow List',
      'maxAddressCount': isZh ? '可绑定最大邮箱地址数量' : 'Maximum number of email addresses',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/user_settings');
      if (res != null) {
        setState(() {
          _enable = res['enable'] ?? false;
          _enableMailVerify = res['enableMailVerify'] ?? false;
          _verifyMailSender = res['verifyMailSender'] ?? '';
          _enableMailAllowList = res['enableMailAllowList'] ?? false;
          _mailAllowList = List<String>.from(res['mailAllowList'] ?? []);
          _maxAddressCount = res['maxAddressCount'] ?? 5;
          _verifyMailSenderController.text = _verifyMailSender;
          _maxAddressCountController.text = _maxAddressCount.toString();
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/user_settings', method: 'POST', body: {
        'enable': _enable,
        'enableMailVerify': _enableMailVerify,
        'verifyMailSender': _verifyMailSenderController.text,
        'enableMailAllowList': _enableMailAllowList,
        'mailAllowList': _mailAllowList,
        'maxAddressCount': int.tryParse(_maxAddressCountController.text) ?? 5,
      });
      _showMessage(_t['successTip']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      FilledButton(
                        onPressed: _loading ? null : _save,
                        child: _loading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text(_t['save']!),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: Text(_t['enableUserRegister']!),
                    value: _enable,
                    onChanged: (v) => setState(() => _enable = v),
                  ),
                  const Divider(),
                  Row(
                    children: [
                      Checkbox(
                        value: _enableMailVerify,
                        onChanged: (v) => setState(() => _enableMailVerify = v ?? false),
                      ),
                      Text(_t['enable']!),
                      const SizedBox(width: 16),
                      if (_enableMailVerify)
                        Expanded(
                          child: TextField(
                            controller: _verifyMailSenderController,
                            decoration: InputDecoration(
                              labelText: _t['verifyMailSender'],
                              border: const OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                    ],
                  ),
                  Text(_t['enableMailVerify']!, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Checkbox(
                        value: _enableMailAllowList,
                        onChanged: (v) => setState(() => _enableMailAllowList = v ?? false),
                      ),
                      Text(_t['enable']!),
                    ],
                  ),
                  Text(_t['enableMailAllowList']!, style: Theme.of(context).textTheme.bodySmall),
                  if (_enableMailAllowList) ...[
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 4,
                      children: _mailAllowList.map((item) => Chip(
                        label: Text(item),
                        onDeleted: () => setState(() => _mailAllowList.remove(item)),
                      )).toList(),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _mailAllowListController,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        hintText: 'Press Enter to add',
                        isDense: true,
                      ),
                      onSubmitted: (value) {
                        if (value.trim().isNotEmpty) {
                          setState(() => _mailAllowList.add(value.trim()));
                          _mailAllowListController.clear();
                        }
                      },
                    ),
                  ],
                  const SizedBox(height: 16),
                  TextField(
                    controller: _maxAddressCountController,
                    decoration: InputDecoration(
                      labelText: _t['maxAddressCount'],
                      border: const OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
