import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class MailWebhookView extends StatefulWidget {
  const MailWebhookView({super.key});

  @override
  State<MailWebhookView> createState() => _MailWebhookViewState();
}

class _MailWebhookViewState extends State<MailWebhookView> {
  bool _loading = false;
  bool _enabled = false;
  String _url = '';
  String _method = 'POST';
  Map<String, String> _headers = {};

  final _urlController = TextEditingController();
  final _headerKeyController = TextEditingController();
  final _headerValueController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'title': isZh ? '邮件 Webhook 设置' : 'Mail Webhook Settings',
      'save': isZh ? '保存' : 'Save',
      'test': isZh ? '测试' : 'Test',
      'successTip': isZh ? '保存成功' : 'Save Success',
      'testSuccess': isZh ? '测试成功' : 'Test Success',
      'enable': isZh ? '启用' : 'Enable',
      'url': 'Webhook URL',
      'method': isZh ? '请求方法' : 'Method',
      'headers': isZh ? '请求头' : 'Headers',
      'addHeader': isZh ? '添加请求头' : 'Add Header',
      'key': isZh ? '键' : 'Key',
      'value': isZh ? '值' : 'Value',
      'delete': isZh ? '删除' : 'Delete',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/mail_webhook/settings');
      if (res != null) {
        setState(() {
          _enabled = res['enabled'] ?? false;
          _url = res['url'] ?? '';
          _method = res['method'] ?? 'POST';
          _headers = Map<String, String>.from(res['headers'] ?? {});
          _urlController.text = _url;
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/mail_webhook/settings', method: 'POST', body: {
        'enabled': _enabled,
        'url': _urlController.text,
        'method': _method,
        'headers': _headers,
      });
      _showMessage(_t['successTip']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _test() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/mail_webhook/test', method: 'POST', body: {
        'enabled': _enabled,
        'url': _urlController.text,
        'method': _method,
        'headers': _headers,
      });
      _showMessage(_t['testSuccess']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  void _addHeader() {
    if (_headerKeyController.text.isNotEmpty) {
      setState(() {
        _headers[_headerKeyController.text] = _headerValueController.text;
        _headerKeyController.clear();
        _headerValueController.clear();
      });
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
                      OutlinedButton(
                        onPressed: _loading ? null : _test,
                        child: Text(_t['test']!),
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
                  SwitchListTile(
                    title: Text(_t['enable']!),
                    value: _enabled,
                    onChanged: (v) => setState(() => _enabled = v),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _urlController,
                    decoration: InputDecoration(
                      labelText: _t['url'],
                      border: const OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(_t['method']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'GET', label: Text('GET')),
                      ButtonSegment(value: 'POST', label: Text('POST')),
                      ButtonSegment(value: 'PUT', label: Text('PUT')),
                    ],
                    selected: {_method},
                    onSelectionChanged: (v) => setState(() => _method = v.first),
                  ),
                  const SizedBox(height: 16),
                  Text(_t['headers']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  ..._headers.entries.map((entry) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      title: Text('${entry.key}: ${entry.value}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => setState(() => _headers.remove(entry.key)),
                      ),
                    ),
                  )),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _headerKeyController,
                          decoration: InputDecoration(
                            labelText: _t['key'],
                            border: const OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _headerValueController,
                          decoration: InputDecoration(
                            labelText: _t['value'],
                            border: const OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.add),
                        onPressed: _addHeader,
                      ),
                    ],
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
