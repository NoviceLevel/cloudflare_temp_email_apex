import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class AccountSettingsView extends StatefulWidget {
  const AccountSettingsView({super.key});

  @override
  State<AccountSettingsView> createState() => _AccountSettingsViewState();
}

class _AccountSettingsViewState extends State<AccountSettingsView> {
  bool _loading = false;
  List<String> _addressBlockList = [];
  List<String> _sendAddressBlockList = [];
  List<String> _noLimitSendAddressList = [];
  List<String> _verifiedAddressList = [];
  List<String> _fromBlockList = [];
  bool _blockReceiveUnknowAddressEmail = false;
  List<Map<String, dynamic>> _emailForwardingList = [];
  bool _showForwardingDialog = false;

  final _blockListController = TextEditingController();
  final _sendBlockListController = TextEditingController();
  final _noLimitController = TextEditingController();
  final _verifiedController = TextEditingController();
  final _fromBlockController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'tip': isZh ? '您可以手动输入以下多选输入框, 回车增加' : 'You can manually input and press enter',
      'save': isZh ? '保存' : 'Save',
      'successTip': isZh ? '保存成功' : 'Save Success',
      'addressBlockList': isZh ? '邮件地址屏蔽关键词(管理员可跳过检查)' : 'Address Block Keywords for Users',
      'sendAddressBlockList': isZh ? '发送邮件地址屏蔽关键词' : 'Address Block Keywords for send email',
      'noLimitSendAddressList': isZh ? '无余额限制发送地址列表' : 'No Balance Limit Send Address List',
      'verifiedAddressList': isZh ? '已验证地址列表(可通过 cf 内部 api 发送邮件)' : 'Verified Address List',
      'fromBlockList': isZh ? '接收邮件地址屏蔽关键词' : 'Block Keywords for receive email',
      'blockReceiveUnknow': isZh ? '禁止接收未知地址邮件' : 'Block receive unknow address email',
      'emailForwardingConfig': isZh ? '邮件转发配置' : 'Email Forwarding Configuration',
      'config': isZh ? '配置' : 'Config',
      'domainList': isZh ? '域名列表' : 'Domain List',
      'forwardAddress': isZh ? '转发地址' : 'Forward Address',
      'add': isZh ? '添加' : 'Add',
      'delete': isZh ? '删除' : 'Delete',
      'cancel': isZh ? '取消' : 'Cancel',
      'forwardingWarning': isZh 
          ? '每条规则都会运行，如果 domains 为空，则转发所有邮件，转发地址需要为已验证的地址' 
          : 'Each rule will run, if domains is empty, all emails will be forwarded',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/account_settings');
      if (res != null) {
        setState(() {
          _addressBlockList = List<String>.from(res['blockList'] ?? []);
          _sendAddressBlockList = List<String>.from(res['sendBlockList'] ?? []);
          _verifiedAddressList = List<String>.from(res['verifiedAddressList'] ?? []);
          _fromBlockList = List<String>.from(res['fromBlockList'] ?? []);
          _noLimitSendAddressList = List<String>.from(res['noLimitSendAddressList'] ?? []);
          final emailRuleSettings = res['emailRuleSettings'] ?? {};
          _blockReceiveUnknowAddressEmail = emailRuleSettings['blockReceiveUnknowAddressEmail'] ?? false;
          _emailForwardingList = List<Map<String, dynamic>>.from(emailRuleSettings['emailForwardingList'] ?? []);
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/account_settings', method: 'POST', body: {
        'blockList': _addressBlockList,
        'sendBlockList': _sendAddressBlockList,
        'verifiedAddressList': _verifiedAddressList,
        'fromBlockList': _fromBlockList,
        'noLimitSendAddressList': _noLimitSendAddressList,
        'emailRuleSettings': {
          'blockReceiveUnknowAddressEmail': _blockReceiveUnknowAddressEmail,
          'emailForwardingList': _emailForwardingList,
        },
      });
      _showMessage(_t['successTip']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Widget _buildChipInput(String label, List<String> items, TextEditingController controller, Function(List<String>) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: [
            ...items.map((item) => Chip(
              label: Text(item),
              onDeleted: () {
                final newList = List<String>.from(items)..remove(item);
                onChanged(newList);
              },
            )),
          ],
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            hintText: 'Press Enter to add',
            isDense: true,
          ),
          onSubmitted: (value) {
            if (value.trim().isNotEmpty) {
              final newList = List<String>.from(items)..add(value.trim());
              onChanged(newList);
              controller.clear();
            }
          },
        ),
        const SizedBox(height: 16),
      ],
    );
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
                      FilledButton(
                        onPressed: _loading ? null : _save,
                        child: _loading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text(_t['save']!),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildChipInput(_t['addressBlockList']!, _addressBlockList, _blockListController, (v) => setState(() => _addressBlockList = v)),
                  _buildChipInput(_t['sendAddressBlockList']!, _sendAddressBlockList, _sendBlockListController, (v) => setState(() => _sendAddressBlockList = v)),
                  _buildChipInput(_t['noLimitSendAddressList']!, _noLimitSendAddressList, _noLimitController, (v) => setState(() => _noLimitSendAddressList = v)),
                  _buildChipInput(_t['verifiedAddressList']!, _verifiedAddressList, _verifiedController, (v) => setState(() => _verifiedAddressList = v)),
                  _buildChipInput(_t['fromBlockList']!, _fromBlockList, _fromBlockController, (v) => setState(() => _fromBlockList = v)),
                  SwitchListTile(
                    title: Text(_t['blockReceiveUnknow']!),
                    value: _blockReceiveUnknowAddressEmail,
                    onChanged: (v) => setState(() => _blockReceiveUnknowAddressEmail = v),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Text('${_t['emailForwardingConfig']}: '),
                      OutlinedButton(
                        onPressed: () => setState(() => _showForwardingDialog = true),
                        child: Text(_t['config']!),
                      ),
                    ],
                  ),
                  if (_showForwardingDialog) _buildForwardingDialog(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForwardingDialog() {
    return AlertDialog(
      title: Text(_t['emailForwardingConfig']!),
      content: SizedBox(
        width: 600,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Card(
                color: Colors.orange.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(_t['forwardingWarning']!),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _emailForwardingList.add({'domains': <String>[], 'forward': ''});
                      });
                    },
                    child: Text(_t['add']!),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ..._emailForwardingList.asMap().entries.map((entry) {
                final index = entry.key;
                final item = entry.value;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      children: [
                        TextField(
                          decoration: InputDecoration(
                            labelText: _t['forwardAddress'],
                            border: const OutlineInputBorder(),
                          ),
                          controller: TextEditingController(text: item['forward'] ?? ''),
                          onChanged: (v) => item['forward'] = v,
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () {
                            setState(() => _emailForwardingList.removeAt(index));
                          },
                          child: Text(_t['delete']!, style: const TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showForwardingDialog = false), child: Text(_t['cancel']!)),
        FilledButton(onPressed: () => setState(() => _showForwardingDialog = false), child: Text(_t['save']!)),
      ],
    );
  }
}
