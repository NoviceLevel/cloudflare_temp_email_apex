import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class AiExtractSettingsView extends StatefulWidget {
  const AiExtractSettingsView({super.key});

  @override
  State<AiExtractSettingsView> createState() => _AiExtractSettingsViewState();
}

class _AiExtractSettingsViewState extends State<AiExtractSettingsView> {
  bool _loading = false;
  bool _enableAllowList = false;
  List<String> _allowList = [];

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
      'title': isZh ? 'AI 邮件提取设置' : 'AI Email Extraction Settings',
      'successTip': isZh ? '成功' : 'Success',
      'save': isZh ? '保存' : 'Save',
      'enableAllowList': isZh ? '启用地址白名单' : 'Enable Address Allowlist',
      'enableAllowListTip': isZh ? '启用后，AI 提取功能仅对白名单中的邮箱地址生效' : 'When enabled, AI extraction will only process emails sent to addresses in the allowlist',
      'allowList': isZh ? '地址白名单 (请输入地址并回车，支持通配符)' : 'Address Allowlist (Enter address and press Enter, wildcards supported)',
      'allowListTip': isZh ? '通配符 * 可匹配任意字符，如 *@example.com 可匹配 example.com 域名下的所有地址' : 'Wildcard * matches any characters',
      'disabledTip': isZh ? '未启用时，所有邮箱地址都可使用 AI 提取功能' : 'When disabled, AI extraction will process all email addresses',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/ai_extract/settings');
      if (res != null) {
        setState(() {
          _enableAllowList = res['enableAllowList'] ?? false;
          _allowList = List<String>.from(res['allowList'] ?? []);
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/ai_extract/settings', method: 'POST', body: {
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
                    children: [
                      Text(_t['title']!, style: Theme.of(context).textTheme.titleLarge),
                      const Spacer(),
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
                  if (!_enableAllowList)
                    Card(
                      color: Colors.blue.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            const Icon(Icons.info, color: Colors.blue),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_t['disabledTip']!)),
                          ],
                        ),
                      ),
                    ),
                  if (_enableAllowList) ...[
                    Card(
                      color: Colors.orange.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            const Icon(Icons.warning, color: Colors.orange),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_t['enableAllowListTip']!)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(_t['allowList']!, style: const TextStyle(fontWeight: FontWeight.w500)),
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
                    const SizedBox(height: 8),
                    Text(_t['allowListTip']!, style: Theme.of(context).textTheme.bodySmall),
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
