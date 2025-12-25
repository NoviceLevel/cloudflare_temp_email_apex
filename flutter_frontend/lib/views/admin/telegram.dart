import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import '../../store/index.dart';
import '../../api/index.dart';

class AdminTelegramView extends StatefulWidget {
  const AdminTelegramView({super.key});

  @override
  State<AdminTelegramView> createState() => _AdminTelegramViewState();
}

class _AdminTelegramViewState extends State<AdminTelegramView> {
  bool _loading = false;
  bool _enableAllowList = false;
  List<String> _allowList = [];
  String _miniAppUrl = '';
  bool _enableGlobalMailPush = false;
  List<String> _globalMailPushList = [];
  Map<String, dynamic>? _status;

  final _miniAppUrlController = TextEditingController();
  final _allowListController = TextEditingController();
  final _globalMailPushController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchSettings();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'init': isZh ? '初始化' : 'Init',
      'successTip': isZh ? '成功' : 'Success',
      'status': isZh ? '查看状态' : 'Check Status',
      'enableTelegramAllowList': isZh ? '启用 Telegram 白名单(手动输入 Chat ID, 回车增加)' : 'Enable Telegram Allow List',
      'enable': isZh ? '启用' : 'Enable',
      'telegramAllowList': isZh ? 'Telegram 白名单(手动输入 Chat ID, 回车增加)' : 'Telegram Allow List',
      'save': isZh ? '保存' : 'Save',
      'miniAppUrl': isZh ? '电报小程序 URL(请输入你部署的电报小程序网页地址)' : 'Telegram Mini App URL',
      'enableGlobalMailPush': isZh ? '启用全局邮件推送(手动输入邮箱管理员的 telegram Chat ID, 回车增加)' : 'Enable Global Mail Push',
      'globalMailPushList': isZh ? '全局邮件推送 Chat ID 列表' : 'Global Mail Push Chat ID List',
      'globalMailPushListTip': isZh 
          ? '支持对话/群组/频道的 Chat ID, 您可以发送一条消息给您的机器人，然后访问此链接来查看 chat_id' 
          : 'Support chat_id of private chat/group/channel',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchSettings() async {
    try {
      final res = await Api.adminFetch('/admin/telegram/settings');
      if (res != null) {
        setState(() {
          _enableAllowList = res['enableAllowList'] ?? false;
          _allowList = List<String>.from(res['allowList'] ?? []);
          _miniAppUrl = res['miniAppUrl'] ?? '';
          _enableGlobalMailPush = res['enableGlobalMailPush'] ?? false;
          _globalMailPushList = List<String>.from(res['globalMailPushList'] ?? []);
          _miniAppUrlController.text = _miniAppUrl;
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _fetchStatus() async {
    try {
      final res = await Api.adminFetch('/admin/telegram/status');
      setState(() => _status = res);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _init() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/telegram/init', method: 'POST');
      _showMessage(_t['successTip']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/telegram/settings', method: 'POST', body: {
        'enableAllowList': _enableAllowList,
        'allowList': _allowList,
        'miniAppUrl': _miniAppUrlController.text,
        'enableGlobalMailPush': _enableGlobalMailPush,
        'globalMailPushList': _globalMailPushList,
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
          children: items.map((item) => Chip(
            label: Text(item),
            onDeleted: () {
              final newList = List<String>.from(items)..remove(item);
              onChanged(newList);
            },
          )).toList(),
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
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
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
                      OutlinedButton(onPressed: _fetchStatus, child: Text(_t['status']!)),
                      const SizedBox(width: 8),
                      OutlinedButton(onPressed: _loading ? null : _init, child: Text(_t['init']!)),
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
                  Text(_t['enableTelegramAllowList']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  Row(
                    children: [
                      Checkbox(
                        value: _enableAllowList,
                        onChanged: (v) => setState(() => _enableAllowList = v ?? false),
                      ),
                      Text(_t['enable']!),
                    ],
                  ),
                  if (_enableAllowList)
                    _buildChipInput(_t['telegramAllowList']!, _allowList, _allowListController, (v) => setState(() => _allowList = v)),
                  const SizedBox(height: 16),
                  Text(_t['enableGlobalMailPush']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  Row(
                    children: [
                      Checkbox(
                        value: _enableGlobalMailPush,
                        onChanged: (v) => setState(() => _enableGlobalMailPush = v ?? false),
                      ),
                      Text(_t['enable']!),
                    ],
                  ),
                  if (_enableGlobalMailPush) ...[
                    _buildChipInput(_t['globalMailPushList']!, _globalMailPushList, _globalMailPushController, (v) => setState(() => _globalMailPushList = v)),
                    const SizedBox(height: 8),
                    Text(_t['globalMailPushListTip']!, style: Theme.of(context).textTheme.bodySmall),
                  ],
                  const SizedBox(height: 16),
                  TextField(
                    controller: _miniAppUrlController,
                    decoration: InputDecoration(
                      labelText: _t['miniAppUrl'],
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  if (_status != null) ...[
                    const SizedBox(height: 16),
                    Card(
                      color: Colors.grey.shade100,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: SelectableText(
                          const JsonEncoder.withIndent('  ').convert(_status),
                          style: const TextStyle(fontFamily: 'monospace'),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
