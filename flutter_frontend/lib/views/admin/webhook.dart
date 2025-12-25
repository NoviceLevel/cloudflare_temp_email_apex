import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class WebhookSettingsView extends StatefulWidget {
  const WebhookSettingsView({super.key});

  @override
  State<WebhookSettingsView> createState() => _WebhookSettingsViewState();
}

class _WebhookSettingsViewState extends State<WebhookSettingsView> {
  bool _loading = false;
  bool _webhookEnabled = false;
  bool _enableAllowList = false;
  List<String> _allowList = [];
  String _errorInfo = '';

  final _allowListController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'successTip': isZh ? '成功' : 'Success',
      'enableAllowList': isZh ? '启用白名单 (限制 webhook 访问权限，只有白名单中的用户可以使用)' : 'Enable Allow List (Restrict webhook access to specific users)',
      'webhookAllowList': isZh ? 'Webhook 白名单(请输入允许使用webhook 的邮箱地址, 回车增加)' : 'Webhook Allow List',
      'save': isZh ? '保存' : 'Save',
      'notEnabled': isZh ? 'Webhook 未开启' : 'Webhook is not enabled',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/webhook/settings');
      if (res != null) {
        setState(() {
          _webhookEnabled = true;
          _enableAllowList = res['enableAllowList'] ?? false;
          _allowList = List<String>.from(res['allowList'] ?? []);
        });
      }
    } catch (e) {
      setState(() {
        _errorInfo = e.toString();
        _webhookEnabled = false;
      });
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/webhook/settings', method: 'POST', body: {
        'enableAllowList': _enableAllowList,
        'allowList': _allowList,
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
    if (!_webhookEnabled) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.warning_amber, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            Text(_t['notEnabled']!, style: Theme.of(context).textTheme.titleLarge),
            if (_errorInfo.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(_errorInfo, style: const TextStyle(color: Colors.grey)),
            ],
          ],
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
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
                    title: Text(_t['enableAllowList']!),
                    value: _enableAllowList,
                    onChanged: (v) => setState(() => _enableAllowList = v),
                  ),
                  const SizedBox(height: 16),
                  Text(_t['webhookAllowList']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: _allowList.map((item) => Chip(
                      label: Text(item),
                      onDeleted: () => setState(() => _allowList.remove(item)),
                    )).toList(),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _allowListController,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: 'Press Enter to add',
                      isDense: true,
                    ),
                    onSubmitted: (value) {
                      if (value.trim().isNotEmpty) {
                        setState(() => _allowList.add(value.trim()));
                        _allowListController.clear();
                      }
                    },
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
