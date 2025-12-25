import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class MaintenanceView extends StatefulWidget {
  const MaintenanceView({super.key});

  @override
  State<MaintenanceView> createState() => _MaintenanceViewState();
}

class _MaintenanceViewState extends State<MaintenanceView> {
  bool _loading = false;
  String _tab = 'basic';

  // Basic cleanup settings
  bool _enableMailsAutoCleanup = false;
  int _cleanMailsDays = 30;
  bool _enableUnknowMailsAutoCleanup = false;
  int _cleanUnknowMailsDays = 30;
  bool _enableSendBoxAutoCleanup = false;
  int _cleanSendBoxDays = 30;
  bool _enableAddressAutoCleanup = false;
  int _cleanAddressDays = 30;
  bool _enableInactiveAddressAutoCleanup = false;
  int _cleanInactiveAddressDays = 30;
  bool _enableUnboundAddressAutoCleanup = false;
  int _cleanUnboundAddressDays = 30;
  bool _enableEmptyAddressAutoCleanup = false;
  int _cleanEmptyAddressDays = 30;

  // Custom SQL cleanup
  List<Map<String, dynamic>> _customSqlCleanupList = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'mailBoxLabel': isZh ? '清理 n 天前的收件箱' : 'Cleanup the inbox before n days',
      'mailUnknowLabel': isZh ? '清理 n 天前的无收件人邮件' : 'Cleanup the unknow mail before n days',
      'sendBoxLabel': isZh ? '清理 n 天前的发件箱' : 'Cleanup the sendbox before n days',
      'addressCreateLabel': isZh ? '清理 n 天前创建的地址' : 'Cleanup the address created before n days',
      'inactiveAddressLabel': isZh ? '清理 n 天前的未活跃地址' : 'Cleanup the inactive address before n days',
      'unboundAddressLabel': isZh ? '清理 n 天前的未绑定用户地址' : 'Cleanup the unbound address before n days',
      'emptyAddressLabel': isZh ? '清理 n 天前空邮件的邮箱地址' : 'Cleanup the empty address before n days',
      'autoCleanup': isZh ? '自动清理' : 'Auto cleanup',
      'cleanupSuccess': isZh ? '清理成功' : 'Cleanup success',
      'saveSuccess': isZh ? '保存成功' : 'Save success',
      'cleanupNow': isZh ? '立即清理' : 'Cleanup now',
      'save': isZh ? '保存' : 'Save',
      'cronTip': isZh ? '启用定时清理, 需在 worker 配置 [crons] 参数, 请参考文档, 配置为 0 天表示全部清空' : 'Enable cron cleanup, need to configure [crons] in worker',
      'basicCleanup': isZh ? '基础清理' : 'Basic Cleanup',
      'customSqlCleanup': isZh ? '自定义 SQL 清理' : 'Custom SQL Cleanup',
      'customSqlTip': isZh ? '添加自定义 DELETE SQL 语句进行定时清理。每条记录仅允许单条 DELETE 语句。' : 'Add custom DELETE SQL statements for scheduled cleanup.',
      'addCustomSql': isZh ? '添加自定义 SQL' : 'Add Custom SQL',
      'sqlName': isZh ? '名称' : 'Name',
      'sqlStatement': isZh ? 'SQL 语句 (仅限 DELETE)' : 'SQL Statement (DELETE only)',
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
      final res = await Api.adminFetch('/admin/auto_cleanup');
      if (res != null) {
        setState(() {
          _enableMailsAutoCleanup = res['enableMailsAutoCleanup'] ?? false;
          _cleanMailsDays = res['cleanMailsDays'] ?? 30;
          _enableUnknowMailsAutoCleanup = res['enableUnknowMailsAutoCleanup'] ?? false;
          _cleanUnknowMailsDays = res['cleanUnknowMailsDays'] ?? 30;
          _enableSendBoxAutoCleanup = res['enableSendBoxAutoCleanup'] ?? false;
          _cleanSendBoxDays = res['cleanSendBoxDays'] ?? 30;
          _enableAddressAutoCleanup = res['enableAddressAutoCleanup'] ?? false;
          _cleanAddressDays = res['cleanAddressDays'] ?? 30;
          _enableInactiveAddressAutoCleanup = res['enableInactiveAddressAutoCleanup'] ?? false;
          _cleanInactiveAddressDays = res['cleanInactiveAddressDays'] ?? 30;
          _enableUnboundAddressAutoCleanup = res['enableUnboundAddressAutoCleanup'] ?? false;
          _cleanUnboundAddressDays = res['cleanUnboundAddressDays'] ?? 30;
          _enableEmptyAddressAutoCleanup = res['enableEmptyAddressAutoCleanup'] ?? false;
          _cleanEmptyAddressDays = res['cleanEmptyAddressDays'] ?? 30;
          _customSqlCleanupList = List<Map<String, dynamic>>.from(res['customSqlCleanupList'] ?? []);
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _save() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/auto_cleanup', method: 'POST', body: {
        'enableMailsAutoCleanup': _enableMailsAutoCleanup,
        'cleanMailsDays': _cleanMailsDays,
        'enableUnknowMailsAutoCleanup': _enableUnknowMailsAutoCleanup,
        'cleanUnknowMailsDays': _cleanUnknowMailsDays,
        'enableSendBoxAutoCleanup': _enableSendBoxAutoCleanup,
        'cleanSendBoxDays': _cleanSendBoxDays,
        'enableAddressAutoCleanup': _enableAddressAutoCleanup,
        'cleanAddressDays': _cleanAddressDays,
        'enableInactiveAddressAutoCleanup': _enableInactiveAddressAutoCleanup,
        'cleanInactiveAddressDays': _cleanInactiveAddressDays,
        'enableUnboundAddressAutoCleanup': _enableUnboundAddressAutoCleanup,
        'cleanUnboundAddressDays': _cleanUnboundAddressDays,
        'enableEmptyAddressAutoCleanup': _enableEmptyAddressAutoCleanup,
        'cleanEmptyAddressDays': _cleanEmptyAddressDays,
        'customSqlCleanupList': _customSqlCleanupList,
      });
      _showMessage(_t['saveSuccess']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _cleanup(String cleanType, int cleanDays) async {
    try {
      await Api.adminFetch('/admin/cleanup', method: 'POST', body: {
        'cleanType': cleanType,
        'cleanDays': cleanDays,
      });
      _showMessage(_t['cleanupSuccess']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Widget _buildCleanupRow(String label, bool enabled, int days, String cleanType, Function(bool) onEnabledChanged, Function(int) onDaysChanged) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Checkbox(value: enabled, onChanged: (v) => onEnabledChanged(v ?? false)),
            Text(_t['autoCleanup']!),
            const SizedBox(width: 8),
            Expanded(child: Text(label)),
            SizedBox(
              width: 80,
              child: TextField(
                controller: TextEditingController(text: days.toString()),
                decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                keyboardType: TextInputType.number,
                onChanged: (v) => onDaysChanged(int.tryParse(v) ?? days),
              ),
            ),
            const SizedBox(width: 8),
            OutlinedButton.icon(
              onPressed: () => _cleanup(cleanType, days),
              icon: const Icon(Icons.cleaning_services, size: 16),
              label: Text(_t['cleanupNow']!),
            ),
          ],
        ),
      ),
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
                  Card(
                    color: Colors.orange.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          const Icon(Icons.warning, color: Colors.orange),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_t['cronTip']!)),
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
                  SegmentedButton<String>(
                    segments: [
                      ButtonSegment(value: 'basic', label: Text(_t['basicCleanup']!)),
                      ButtonSegment(value: 'custom_sql', label: Text(_t['customSqlCleanup']!)),
                    ],
                    selected: {_tab},
                    onSelectionChanged: (v) => setState(() => _tab = v.first),
                  ),
                  const SizedBox(height: 16),
                  if (_tab == 'basic') ...[
                    _buildCleanupRow(_t['mailBoxLabel']!, _enableMailsAutoCleanup, _cleanMailsDays, 'mails',
                        (v) => setState(() => _enableMailsAutoCleanup = v), (v) => setState(() => _cleanMailsDays = v)),
                    _buildCleanupRow(_t['mailUnknowLabel']!, _enableUnknowMailsAutoCleanup, _cleanUnknowMailsDays, 'mails_unknow',
                        (v) => setState(() => _enableUnknowMailsAutoCleanup = v), (v) => setState(() => _cleanUnknowMailsDays = v)),
                    _buildCleanupRow(_t['sendBoxLabel']!, _enableSendBoxAutoCleanup, _cleanSendBoxDays, 'sendbox',
                        (v) => setState(() => _enableSendBoxAutoCleanup = v), (v) => setState(() => _cleanSendBoxDays = v)),
                    _buildCleanupRow(_t['addressCreateLabel']!, _enableAddressAutoCleanup, _cleanAddressDays, 'addressCreated',
                        (v) => setState(() => _enableAddressAutoCleanup = v), (v) => setState(() => _cleanAddressDays = v)),
                    _buildCleanupRow(_t['inactiveAddressLabel']!, _enableInactiveAddressAutoCleanup, _cleanInactiveAddressDays, 'inactiveAddress',
                        (v) => setState(() => _enableInactiveAddressAutoCleanup = v), (v) => setState(() => _cleanInactiveAddressDays = v)),
                    _buildCleanupRow(_t['unboundAddressLabel']!, _enableUnboundAddressAutoCleanup, _cleanUnboundAddressDays, 'unboundAddress',
                        (v) => setState(() => _enableUnboundAddressAutoCleanup = v), (v) => setState(() => _cleanUnboundAddressDays = v)),
                    _buildCleanupRow(_t['emptyAddressLabel']!, _enableEmptyAddressAutoCleanup, _cleanEmptyAddressDays, 'emptyAddress',
                        (v) => setState(() => _enableEmptyAddressAutoCleanup = v), (v) => setState(() => _cleanEmptyAddressDays = v)),
                  ] else ...[
                    Card(
                      color: Colors.blue.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            const Icon(Icons.info, color: Colors.blue),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_t['customSqlTip']!)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ..._customSqlCleanupList.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  Checkbox(
                                    value: item['enabled'] ?? false,
                                    onChanged: (v) => setState(() => item['enabled'] = v),
                                  ),
                                  Text(_t['autoCleanup']!),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: TextField(
                                      controller: TextEditingController(text: item['name'] ?? ''),
                                      decoration: InputDecoration(labelText: _t['sqlName'], border: const OutlineInputBorder(), isDense: true),
                                      onChanged: (v) => item['name'] = v,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  TextButton(
                                    onPressed: () => setState(() => _customSqlCleanupList.removeAt(index)),
                                    child: Text(_t['delete']!, style: const TextStyle(color: Colors.red)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: TextEditingController(text: item['sql'] ?? ''),
                                decoration: InputDecoration(labelText: _t['sqlStatement'], border: const OutlineInputBorder()),
                                maxLines: 2,
                                onChanged: (v) => item['sql'] = v,
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                    OutlinedButton.icon(
                      onPressed: () {
                        setState(() {
                          _customSqlCleanupList.add({
                            'id': DateTime.now().millisecondsSinceEpoch.toString(),
                            'name': '',
                            'sql': '',
                            'enabled': false,
                          });
                        });
                      },
                      icon: const Icon(Icons.add),
                      label: Text(_t['addCustomSql']!),
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
