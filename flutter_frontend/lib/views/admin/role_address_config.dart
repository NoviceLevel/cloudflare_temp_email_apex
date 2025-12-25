import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class RoleAddressConfigView extends StatefulWidget {
  const RoleAddressConfigView({super.key});

  @override
  State<RoleAddressConfigView> createState() => _RoleAddressConfigViewState();
}

class _RoleAddressConfigViewState extends State<RoleAddressConfigView> {
  bool _loading = false;
  List<Map<String, dynamic>> _systemRoles = [];
  List<Map<String, dynamic>> _tableData = [];

  @override
  void initState() {
    super.initState();
    _fetchUserRoles();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'role': isZh ? '角色' : 'Role',
      'maxAddressCount': isZh ? '最大地址数量' : 'Max Address Count',
      'save': isZh ? '保存' : 'Save',
      'successTip': isZh ? '成功' : 'Success',
      'noRolesAvailable': isZh ? '系统配置中没有可用的角色' : 'No roles available in system config',
      'roleConfigDesc': isZh ? '为每个用户角色配置最大地址数量。角色配置优先于全局设置。' : 'Configure maximum address count for each user role.',
      'notConfigured': isZh ? '未配置（使用全局设置）' : 'Not Configured (Use Global Settings)',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchUserRoles() async {
    try {
      final res = await Api.adminFetch('/admin/user_roles');
      if (res != null) {
        setState(() => _systemRoles = List<Map<String, dynamic>>.from(res));
        await _fetchRoleConfigs();
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _fetchRoleConfigs() async {
    try {
      final res = await Api.adminFetch('/admin/role_address_config');
      if (res != null) {
        final configs = res['configs'] ?? {};
        setState(() {
          _tableData = _systemRoles.map((roleObj) {
            final role = roleObj['role'];
            return {
              'role': role,
              'max_address_count': configs[role]?['maxAddressCount'],
            };
          }).toList();
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _saveConfig() async {
    setState(() => _loading = true);
    try {
      final configs = <String, dynamic>{};
      for (final row in _tableData) {
        if (row['max_address_count'] != null) {
          configs[row['role']] = {'maxAddressCount': row['max_address_count']};
        }
      }
      await Api.adminFetch('/admin/role_address_config', method: 'POST', body: {'configs': configs});
      _showMessage(_t['successTip']!);
      await _fetchRoleConfigs();
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
                  Card(
                    color: Colors.blue.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          const Icon(Icons.info, color: Colors.blue),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_t['roleConfigDesc']!)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_systemRoles.isEmpty)
                    Card(
                      color: Colors.orange.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            const Icon(Icons.warning, color: Colors.orange),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_t['noRolesAvailable']!)),
                          ],
                        ),
                      ),
                    )
                  else ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        FilledButton(
                          onPressed: _loading ? null : _saveConfig,
                          child: _loading
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : Text(_t['save']!),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    DataTable(
                      columns: [
                        DataColumn(label: Text(_t['role']!)),
                        DataColumn(label: Text(_t['maxAddressCount']!)),
                      ],
                      rows: _tableData.asMap().entries.map((entry) {
                        final index = entry.key;
                        final item = entry.value;
                        return DataRow(cells: [
                          DataCell(Chip(label: Text(item['role'] ?? ''), backgroundColor: Colors.blue.shade100)),
                          DataCell(
                            SizedBox(
                              width: 150,
                              child: TextField(
                                controller: TextEditingController(text: item['max_address_count']?.toString() ?? ''),
                                decoration: InputDecoration(
                                  border: const OutlineInputBorder(),
                                  isDense: true,
                                  hintText: _t['notConfigured'],
                                ),
                                keyboardType: TextInputType.number,
                                onChanged: (v) {
                                  final val = int.tryParse(v);
                                  setState(() => _tableData[index]['max_address_count'] = val);
                                },
                              ),
                            ),
                          ),
                        ]);
                      }).toList(),
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
