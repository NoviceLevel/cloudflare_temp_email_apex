import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class IpBlacklistSettingsView extends StatefulWidget {
  const IpBlacklistSettingsView({super.key});

  @override
  State<IpBlacklistSettingsView> createState() => _IpBlacklistSettingsViewState();
}

class _IpBlacklistSettingsViewState extends State<IpBlacklistSettingsView> {
  bool _loading = false;
  bool _enabled = false;
  List<String> _ipBlacklist = [];
  List<String> _asnBlacklist = [];
  List<String> _fingerprintBlacklist = [];
  bool _enableDailyLimit = false;
  int _dailyRequestLimit = 1000;

  final _ipController = TextEditingController();
  final _asnController = TextEditingController();
  final _fingerprintController = TextEditingController();
  final _dailyLimitController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'title': isZh ? 'IP 黑名单设置' : 'IP Blacklist Settings',
      'save': isZh ? '保存' : 'Save',
      'successTip': isZh ? '保存成功' : 'Save Success',
      'enableIpBlacklist': isZh ? '启用 IP 黑名单' : 'Enable IP Blacklist',
      'enableTip': isZh ? '阻止匹配黑名单的 IP 访问限流 API' : 'Block IPs matching blacklist patterns',
      'ipBlacklist': isZh ? 'IP 黑名单匹配模式' : 'IP Blacklist Patterns',
      'asnBlacklist': isZh ? 'ASN 组织（运营商）黑名单' : 'ASN Organization Blacklist',
      'fingerprintBlacklist': isZh ? '浏览器指纹黑名单' : 'Browser Fingerprint Blacklist',
      'enableDailyLimit': isZh ? '启用每日请求限流' : 'Enable Daily Request Limit',
      'dailyRequestLimit': isZh ? '每日请求次数上限' : 'Daily Request Limit',
      'tipScope': isZh ? '作用范围：创建邮箱地址、发送邮件、外部发送邮件 API、用户注册、验证码验证' : 'Applies to: Create Address, Send Mail, External Send Mail API, User Registration, Verify Code',
      'tipIp': isZh ? 'IP 黑名单：支持文本匹配或正则表达式' : 'IP Blacklist: Supports text matching or regex',
      'tipAsn': isZh ? 'ASN 组织：根据运营商/ISP 拉黑' : 'ASN Organization: Block by ISP/provider',
      'tipFingerprint': isZh ? '浏览器指纹：根据浏览器指纹拉黑' : 'Browser Fingerprint: Block by browser fingerprint',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    setState(() => _loading = true);
    try {
      final res = await Api.adminFetch('/admin/ip_blacklist/settings');
      if (res != null) {
        setState(() {
          _enabled = res['enabled'] ?? false;
          _ipBlacklist = List<String>.from(res['blacklist'] ?? []);
          _asnBlacklist = List<String>.from(res['asnBlacklist'] ?? []);
          _fingerprintBlacklist = List<String>.from(res['fingerprintBlacklist'] ?? []);
          _enableDailyLimit = res['enableDailyLimit'] ?? false;
          _dailyRequestLimit = res['dailyRequestLimit'] ?? 1000;
          _dailyLimitController.text = _dailyRequestLimit.toString();
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/ip_blacklist/settings', method: 'POST', body: {
        'enabled': _enabled,
        'blacklist': _ipBlacklist,
        'asnBlacklist': _asnBlacklist,
        'fingerprintBlacklist': _fingerprintBlacklist,
        'enableDailyLimit': _enableDailyLimit,
        'dailyRequestLimit': int.tryParse(_dailyLimitController.text) ?? 1000,
      });
      _showMessage(_t['successTip']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Widget _buildChipInput(String label, List<String> items, TextEditingController controller, Function(List<String>) onChanged, {bool disabled = false}) {
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
            onDeleted: disabled ? null : () {
              final newList = List<String>.from(items)..remove(item);
              onChanged(newList);
            },
          )).toList(),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          enabled: !disabled,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            hintText: 'Press Enter to add',
            isDense: true,
          ),
          onSubmitted: (value) {
            if (value.trim().isNotEmpty && !disabled) {
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
                  Card(
                    color: Colors.blue.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('• ${_t['tipScope']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                          Text('• ${_t['tipIp']}'),
                          Text('• ${_t['tipAsn']}'),
                          Text('• ${_t['tipFingerprint']}'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SwitchListTile(
                    title: Text(_t['enableIpBlacklist']!),
                    subtitle: Text(_t['enableTip']!),
                    value: _enabled,
                    onChanged: (v) => setState(() => _enabled = v),
                  ),
                  const SizedBox(height: 16),
                  _buildChipInput(_t['ipBlacklist']!, _ipBlacklist, _ipController, (v) => setState(() => _ipBlacklist = v), disabled: !_enabled),
                  _buildChipInput(_t['asnBlacklist']!, _asnBlacklist, _asnController, (v) => setState(() => _asnBlacklist = v), disabled: !_enabled),
                  _buildChipInput(_t['fingerprintBlacklist']!, _fingerprintBlacklist, _fingerprintController, (v) => setState(() => _fingerprintBlacklist = v), disabled: !_enabled),
                  const Divider(),
                  SwitchListTile(
                    title: Text(_t['enableDailyLimit']!),
                    value: _enableDailyLimit,
                    onChanged: (v) => setState(() => _enableDailyLimit = v),
                  ),
                  TextField(
                    controller: _dailyLimitController,
                    enabled: _enableDailyLimit,
                    decoration: InputDecoration(
                      labelText: _t['dailyRequestLimit'],
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
