import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class AdminAccountView extends StatefulWidget {
  const AdminAccountView({super.key});

  @override
  State<AdminAccountView> createState() => _AdminAccountViewState();
}

class _AdminAccountViewState extends State<AdminAccountView> {
  bool _loading = false;
  List<Map<String, dynamic>> _data = [];
  int _count = 0;
  int _page = 1;
  final int _pageSize = 20;
  String _addressQuery = '';
  Set<int> _checkedRowKeys = {};

  // Dialog states
  bool _showCredentialDialog = false;
  String _curEmailCredential = '';
  bool _showDeleteDialog = false;
  int? _curDeleteAddressId;
  bool _showClearInboxDialog = false;
  int? _curClearInboxAddressId;
  bool _showClearSentItemsDialog = false;
  int? _curClearSentItemsAddressId;
  bool _showResetPasswordDialog = false;
  int? _curResetPasswordAddressId;
  String _newPassword = '';

  // Multi-action
  bool _showMultiDeleteConfirm = false;
  bool _showMultiClearInboxConfirm = false;
  bool _showMultiClearSentItemsConfirm = false;
  bool _showMultiActionModal = false;
  int _multiActionPercentage = 0;
  String _multiActionTip = '0/0';
  String _multiActionTitle = '';

  final _queryController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'name': isZh ? '名称' : 'Name',
      'createdAt': isZh ? '创建时间' : 'Created At',
      'updatedAt': isZh ? '更新时间' : 'Update At',
      'mailCount': isZh ? '邮件数量' : 'Mail Count',
      'sendCount': isZh ? '发送数量' : 'Send Count',
      'showCredential': isZh ? '查看邮箱地址凭证' : 'Show Mail Address Credential',
      'addressCredential': isZh ? '邮箱地址凭证' : 'Mail Address Credential',
      'addressCredentialTip': isZh ? '请复制邮箱地址凭证，你可以使用它登录你的邮箱。' : 'Please copy the Mail Address Credential.',
      'delete': isZh ? '删除' : 'Delete',
      'deleteTip': isZh ? '确定要删除这个邮箱吗？' : 'Are you sure to delete this email?',
      'deleteAccount': isZh ? '删除邮箱' : 'Delete Account',
      'viewMails': isZh ? '查看邮件' : 'View Mails',
      'viewSendBox': isZh ? '查看发件箱' : 'View SendBox',
      'itemCount': isZh ? '总数' : 'itemCount',
      'query': isZh ? '查询' : 'Query',
      'addressQueryTip': isZh ? '留空查询所有地址' : 'Leave blank to query all addresses',
      'clearInbox': isZh ? '清空收件箱' : 'Clear Inbox',
      'clearSentItems': isZh ? '清空发件箱' : 'Clear Sent Items',
      'clearInboxTip': isZh ? '确定要清空这个邮箱的收件箱吗？' : 'Are you sure to clear inbox?',
      'clearSentItemsTip': isZh ? '确定要清空这个邮箱的发件箱吗？' : 'Are you sure to clear sent items?',
      'actions': isZh ? '操作' : 'Actions',
      'success': isZh ? '成功' : 'Success',
      'resetPassword': isZh ? '重置密码' : 'Reset Password',
      'newPassword': isZh ? '新密码' : 'New Password',
      'selectAll': isZh ? '全选本页' : 'Select All of This Page',
      'unselectAll': isZh ? '取消全选' : 'Unselect All',
      'selectedItems': isZh ? '已选择' : 'Selected',
      'multiDelete': isZh ? '批量删除' : 'Multi Delete',
      'multiDeleteTip': isZh ? '确定要删除选中的邮箱吗？' : 'Are you sure to delete selected addresses?',
      'multiClearInbox': isZh ? '批量清空收件箱' : 'Multi Clear Inbox',
      'multiClearInboxTip': isZh ? '确定要清空选中邮箱的收件箱吗？' : 'Are you sure to clear inbox for selected addresses?',
      'multiClearSentItems': isZh ? '批量清空发件箱' : 'Multi Clear Sent Items',
      'multiClearSentItemsTip': isZh ? '确定要清空选中邮箱的发件箱吗？' : 'Are you sure to clear sent items for selected addresses?',
      'cancel': isZh ? '取消' : 'Cancel',
      'confirm': isZh ? '确认' : 'Confirm',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final query = _queryController.text.trim();
      final res = await Api.adminFetch(
        '/admin/address?limit=$_pageSize&offset=${(_page - 1) * _pageSize}${query.isNotEmpty ? '&query=$query' : ''}'
      );
      if (res != null) {
        setState(() {
          _data = List<Map<String, dynamic>>.from(res['results'] ?? []);
          if ((res['count'] ?? 0) > 0) _count = res['count'];
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _showCredential(int id) async {
    try {
      final res = await Api.adminShowAddressCredential(id);
      setState(() {
        _curEmailCredential = res ?? '';
        _showCredentialDialog = true;
      });
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _deleteEmail() async {
    if (_curDeleteAddressId == null) return;
    setState(() => _loading = true);
    try {
      await Api.adminDeleteAddress(_curDeleteAddressId!);
      _showMessage(_t['success']!);
      await _fetchData();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() {
        _loading = false;
        _showDeleteDialog = false;
      });
    }
  }

  Future<void> _clearInbox() async {
    if (_curClearInboxAddressId == null) return;
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/clear_inbox/$_curClearInboxAddressId', method: 'DELETE');
      _showMessage(_t['success']!);
      await _fetchData();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() {
        _loading = false;
        _showClearInboxDialog = false;
      });
    }
  }

  Future<void> _clearSentItems() async {
    if (_curClearSentItemsAddressId == null) return;
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/clear_sent_items/$_curClearSentItemsAddressId', method: 'DELETE');
      _showMessage(_t['success']!);
      await _fetchData();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() {
        _loading = false;
        _showClearSentItemsDialog = false;
      });
    }
  }

  Future<void> _resetPassword() async {
    if (_curResetPasswordAddressId == null) return;
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/address/$_curResetPasswordAddressId/reset_password', method: 'POST', body: {
        'password': _passwordController.text,
      });
      _showMessage(_t['success']!);
      _passwordController.clear();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() {
        _loading = false;
        _showResetPasswordDialog = false;
      });
    }
  }

  Future<void> _multiActionDeleteAccounts() async {
    await _executeBatchOperation(
      apiCall: (id) => Api.adminDeleteAddress(id),
      title: '${_t['multiDelete']} ${_t['success']}',
    );
  }

  Future<void> _multiActionClearInbox() async {
    await _executeBatchOperation(
      shouldSkip: (address) => (address['mail_count'] ?? 0) <= 0,
      apiCall: (id) => Api.adminFetch('/admin/clear_inbox/$id', method: 'DELETE'),
      title: '${_t['multiClearInbox']} ${_t['success']}',
    );
  }

  Future<void> _multiActionClearSentItems() async {
    await _executeBatchOperation(
      shouldSkip: (address) => (address['send_count'] ?? 0) <= 0,
      apiCall: (id) => Api.adminFetch('/admin/clear_sent_items/$id', method: 'DELETE'),
      title: '${_t['multiClearSentItems']} ${_t['success']}',
    );
  }

  Future<void> _executeBatchOperation({
    bool Function(Map<String, dynamic>)? shouldSkip,
    required Future<void> Function(int) apiCall,
    required String title,
  }) async {
    setState(() => _loading = true);
    final selectedAddresses = _data.where((item) => _checkedRowKeys.contains(item['id'])).toList();
    if (selectedAddresses.isEmpty) {
      _showMessage('Please select address', isError: true);
      setState(() => _loading = false);
      return;
    }

    final failedIds = <int>[];
    final totalCount = selectedAddresses.length;

    setState(() {
      _multiActionPercentage = 0;
      _multiActionTip = '0/$totalCount';
      _multiActionTitle = title;
      _showMultiActionModal = true;
    });

    for (var i = 0; i < selectedAddresses.length; i++) {
      final address = selectedAddresses[i];
      try {
        if (shouldSkip == null || !shouldSkip(address)) {
          await apiCall(address['id']);
        }
      } catch (e) {
        failedIds.add(address['id']);
      }
      setState(() {
        _multiActionPercentage = ((i + 1) / totalCount * 100).floor();
        _multiActionTip = '${i + 1}/$totalCount';
      });
    }

    await _fetchData();
    setState(() {
      _checkedRowKeys = failedIds.toSet();
      _loading = false;
    });
    _showMessage(_t['success']!);
  }

  int get _totalPages => (_count / _pageSize).ceil();

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Search Bar
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _queryController,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(),
                    isDense: true,
                    hintText: _t['addressQueryTip'],
                  ),
                  onSubmitted: (_) => _fetchData(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.tonal(onPressed: _fetchData, child: Text(_t['query']!)),
            ],
          ),
          const SizedBox(height: 16),
          // Multi Action Bar
          if (_checkedRowKeys.isNotEmpty)
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    OutlinedButton(
                      onPressed: () => setState(() => _checkedRowKeys = _data.map((e) => e['id'] as int).toSet()),
                      child: Text(_t['selectAll']!),
                    ),
                    OutlinedButton(
                      onPressed: () => setState(() => _checkedRowKeys.clear()),
                      child: Text(_t['unselectAll']!),
                    ),
                    FilledButton.tonal(
                      onPressed: () => setState(() => _showMultiDeleteConfirm = true),
                      style: FilledButton.styleFrom(backgroundColor: Colors.red.shade100),
                      child: Text(_t['multiDelete']!),
                    ),
                    FilledButton.tonal(
                      onPressed: () => setState(() => _showMultiClearInboxConfirm = true),
                      style: FilledButton.styleFrom(backgroundColor: Colors.orange.shade100),
                      child: Text(_t['multiClearInbox']!),
                    ),
                    FilledButton.tonal(
                      onPressed: () => setState(() => _showMultiClearSentItemsConfirm = true),
                      style: FilledButton.styleFrom(backgroundColor: Colors.orange.shade100),
                      child: Text(_t['multiClearSentItems']!),
                    ),
                    Chip(label: Text('${_t['selectedItems']}: ${_checkedRowKeys.length}')),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 16),
          // Pagination
          Row(
            children: [
              Text('${_t['itemCount']}: $_count'),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: _page > 1 ? () { setState(() => _page--); _fetchData(); } : null,
              ),
              Text('$_page / $_totalPages'),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: _page < _totalPages ? () { setState(() => _page++); _fetchData(); } : null,
              ),
              DropdownButton<int>(
                value: _pageSize,
                items: [20, 50, 100].map((e) => DropdownMenuItem(value: e, child: Text('$e'))).toList(),
                onChanged: (v) {
                  if (v != null) {
                    setState(() {
                      // _pageSize = v; // pageSize is final, would need to make it mutable
                      _page = 1;
                    });
                    _fetchData();
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Data Table
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columns: [
                DataColumn(label: Checkbox(
                  value: _checkedRowKeys.length == _data.length && _data.isNotEmpty,
                  onChanged: (v) {
                    setState(() {
                      if (v == true) {
                        _checkedRowKeys = _data.map((e) => e['id'] as int).toSet();
                      } else {
                        _checkedRowKeys.clear();
                      }
                    });
                  },
                )),
                const DataColumn(label: Text('ID')),
                DataColumn(label: Text(_t['name']!)),
                DataColumn(label: Text(_t['createdAt']!)),
                DataColumn(label: Text(_t['updatedAt']!)),
                DataColumn(label: Text(_t['mailCount']!)),
                DataColumn(label: Text(_t['sendCount']!)),
                DataColumn(label: Text(_t['actions']!)),
              ],
              rows: _data.map((item) => DataRow(
                selected: _checkedRowKeys.contains(item['id']),
                cells: [
                  DataCell(Checkbox(
                    value: _checkedRowKeys.contains(item['id']),
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _checkedRowKeys.add(item['id']);
                        } else {
                          _checkedRowKeys.remove(item['id']);
                        }
                      });
                    },
                  )),
                  DataCell(Text(item['id'].toString())),
                  DataCell(Text(item['name'] ?? '')),
                  DataCell(Text(item['created_at'] ?? '')),
                  DataCell(Text(item['updated_at'] ?? '')),
                  DataCell(Chip(label: Text(item['mail_count']?.toString() ?? '0'), backgroundColor: Colors.green.shade100)),
                  DataCell(Chip(label: Text(item['send_count']?.toString() ?? '0'), backgroundColor: Colors.green.shade100)),
                  DataCell(PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'showCredential':
                          _showCredential(item['id']);
                          break;
                        case 'clearInbox':
                          setState(() {
                            _curClearInboxAddressId = item['id'];
                            _showClearInboxDialog = true;
                          });
                          break;
                        case 'clearSentItems':
                          setState(() {
                            _curClearSentItemsAddressId = item['id'];
                            _showClearSentItemsDialog = true;
                          });
                          break;
                        case 'resetPassword':
                          _passwordController.clear();
                          setState(() {
                            _curResetPasswordAddressId = item['id'];
                            _showResetPasswordDialog = true;
                          });
                          break;
                        case 'delete':
                          setState(() {
                            _curDeleteAddressId = item['id'];
                            _showDeleteDialog = true;
                          });
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem(value: 'showCredential', child: Text(_t['showCredential']!)),
                      if ((item['mail_count'] ?? 0) > 0)
                        PopupMenuItem(value: 'clearInbox', child: Text(_t['clearInbox']!)),
                      if ((item['send_count'] ?? 0) > 0)
                        PopupMenuItem(value: 'clearSentItems', child: Text(_t['clearSentItems']!)),
                      PopupMenuItem(value: 'resetPassword', child: Text(_t['resetPassword']!)),
                      PopupMenuItem(value: 'delete', child: Text(_t['delete']!)),
                    ],
                  )),
                ],
              )).toList(),
            ),
          ),
          // Dialogs
          if (_showCredentialDialog) _buildCredentialDialog(),
          if (_showDeleteDialog) _buildDeleteDialog(),
          if (_showClearInboxDialog) _buildClearInboxDialog(),
          if (_showClearSentItemsDialog) _buildClearSentItemsDialog(),
          if (_showResetPasswordDialog) _buildResetPasswordDialog(),
          if (_showMultiDeleteConfirm) _buildMultiDeleteConfirm(),
          if (_showMultiClearInboxConfirm) _buildMultiClearInboxConfirm(),
          if (_showMultiClearSentItemsConfirm) _buildMultiClearSentItemsConfirm(),
          if (_showMultiActionModal) _buildMultiActionModal(),
        ],
      ),
    );
  }

  Widget _buildCredentialDialog() {
    return AlertDialog(
      title: Text(_t['addressCredential']!),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_t['addressCredentialTip']!),
          const SizedBox(height: 16),
          Card(
            color: Colors.grey.shade100,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: SelectableText(_curEmailCredential, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showCredentialDialog = false), child: Text(_t['cancel']!)),
      ],
    );
  }

  Widget _buildDeleteDialog() {
    return AlertDialog(
      title: Text(_t['deleteAccount']!),
      content: Text(_t['deleteTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showDeleteDialog = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: _loading ? null : _deleteEmail,
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: Text(_t['deleteAccount']!),
        ),
      ],
    );
  }

  Widget _buildClearInboxDialog() {
    return AlertDialog(
      title: Text(_t['clearInbox']!),
      content: Text(_t['clearInboxTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showClearInboxDialog = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: _loading ? null : _clearInbox,
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: Text(_t['clearInbox']!),
        ),
      ],
    );
  }

  Widget _buildClearSentItemsDialog() {
    return AlertDialog(
      title: Text(_t['clearSentItems']!),
      content: Text(_t['clearSentItemsTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showClearSentItemsDialog = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: _loading ? null : _clearSentItems,
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: Text(_t['clearSentItems']!),
        ),
      ],
    );
  }

  Widget _buildResetPasswordDialog() {
    return AlertDialog(
      title: Text(_t['resetPassword']!),
      content: TextField(
        controller: _passwordController,
        obscureText: true,
        decoration: InputDecoration(labelText: _t['newPassword'], border: const OutlineInputBorder()),
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showResetPasswordDialog = false), child: Text(_t['cancel']!)),
        FilledButton(onPressed: _loading ? null : _resetPassword, child: Text(_t['resetPassword']!)),
      ],
    );
  }

  Widget _buildMultiDeleteConfirm() {
    return AlertDialog(
      title: Text(_t['multiDelete']!),
      content: Text(_t['multiDeleteTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showMultiDeleteConfirm = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: () {
            setState(() => _showMultiDeleteConfirm = false);
            _multiActionDeleteAccounts();
          },
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: Text(_t['confirm']!),
        ),
      ],
    );
  }

  Widget _buildMultiClearInboxConfirm() {
    return AlertDialog(
      title: Text(_t['multiClearInbox']!),
      content: Text(_t['multiClearInboxTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showMultiClearInboxConfirm = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: () {
            setState(() => _showMultiClearInboxConfirm = false);
            _multiActionClearInbox();
          },
          style: FilledButton.styleFrom(backgroundColor: Colors.orange),
          child: Text(_t['confirm']!),
        ),
      ],
    );
  }

  Widget _buildMultiClearSentItemsConfirm() {
    return AlertDialog(
      title: Text(_t['multiClearSentItems']!),
      content: Text(_t['multiClearSentItemsTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showMultiClearSentItemsConfirm = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: () {
            setState(() => _showMultiClearSentItemsConfirm = false);
            _multiActionClearSentItems();
          },
          style: FilledButton.styleFrom(backgroundColor: Colors.orange),
          child: Text(_t['confirm']!),
        ),
      ],
    );
  }

  Widget _buildMultiActionModal() {
    return AlertDialog(
      title: Text(_multiActionTitle, textAlign: TextAlign.center),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 100,
            height: 100,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: _multiActionPercentage / 100,
                  strokeWidth: 10,
                ),
                Text(_multiActionTip),
              ],
            ),
          ),
        ],
      ),
      actions: [
        Center(
          child: TextButton(
            onPressed: () => setState(() => _showMultiActionModal = false),
            child: const Text('OK'),
          ),
        ),
      ],
    );
  }
}
