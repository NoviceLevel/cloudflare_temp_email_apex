import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class SenderAccessView extends StatefulWidget {
  const SenderAccessView({super.key});

  @override
  State<SenderAccessView> createState() => _SenderAccessViewState();
}

class _SenderAccessViewState extends State<SenderAccessView> {
  bool _loading = false;
  List<Map<String, dynamic>> _data = [];
  int _count = 0;
  int _page = 1;
  final int _pageSize = 20;
  String _addressQuery = '';
  
  Map<String, dynamic>? _curRow;
  bool _showModal = false;
  int _senderBalance = 0;
  bool _senderEnabled = false;
  bool _showDeleteConfirm = false;
  int? _deleteRowId;

  final _addressQueryController = TextEditingController();
  final _balanceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'address': isZh ? '地址' : 'Address',
      'success': isZh ? '成功' : 'Success',
      'isEnabled': isZh ? '是否启用' : 'Is Enabled',
      'enable': isZh ? '启用' : 'Enable',
      'disable': isZh ? '禁用' : 'Disable',
      'modify': isZh ? '修改' : 'Modify',
      'delete': isZh ? '删除' : 'Delete',
      'deleteTip': isZh ? '确定删除吗？' : 'Are you sure to delete?',
      'createdAt': isZh ? '创建时间' : 'Created At',
      'action': isZh ? '操作' : 'Action',
      'itemCount': isZh ? '总数' : 'itemCount',
      'modalTip': isZh ? '请输入发件额度' : 'Please input the sender balance',
      'balance': isZh ? '余额' : 'Balance',
      'query': isZh ? '查询' : 'Query',
      'ok': isZh ? '确定' : 'OK',
      'cancel': isZh ? '取消' : 'Cancel',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final query = _addressQueryController.text.trim();
      final res = await Api.adminFetch(
        '/admin/address_sender?limit=$_pageSize&offset=${(_page - 1) * _pageSize}${query.isNotEmpty ? '&address=$query' : ''}'
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

  Future<void> _updateData() async {
    if (_curRow == null) return;
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/address_sender', method: 'POST', body: {
        'address': _curRow!['address'],
        'address_id': _curRow!['id'],
        'balance': int.tryParse(_balanceController.text) ?? 0,
        'enabled': _senderEnabled ? 1 : 0,
      });
      _showMessage(_t['success']!);
      setState(() => _showModal = false);
      await _fetchData();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _doDelete() async {
    if (_deleteRowId == null) return;
    try {
      await Api.adminFetch('/admin/address_sender/$_deleteRowId', method: 'DELETE');
      _showMessage(_t['success']!);
      await _fetchData();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() {
        _showDeleteConfirm = false;
        _deleteRowId = null;
      });
    }
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
                  controller: _addressQueryController,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onSubmitted: (_) => _fetchData(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.tonal(onPressed: _fetchData, child: Text(_t['query']!)),
            ],
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
            ],
          ),
          const SizedBox(height: 16),
          // Data Table
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columns: [
                const DataColumn(label: Text('ID')),
                DataColumn(label: Text(_t['address']!)),
                DataColumn(label: Text(_t['createdAt']!)),
                DataColumn(label: Text(_t['balance']!)),
                DataColumn(label: Text(_t['isEnabled']!)),
                DataColumn(label: Text(_t['action']!)),
              ],
              rows: _data.map((item) => DataRow(cells: [
                DataCell(Text(item['id'].toString())),
                DataCell(Text(item['address'] ?? '')),
                DataCell(Text(item['created_at'] ?? '')),
                DataCell(Text(item['balance']?.toString() ?? '0')),
                DataCell(Chip(
                  label: Text(item['enabled'] == true ? _t['enable']! : _t['disable']!),
                  backgroundColor: item['enabled'] == true ? Colors.green.shade100 : Colors.grey.shade200,
                )),
                DataCell(Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _curRow = item;
                          _senderEnabled = item['enabled'] == true;
                          _senderBalance = item['balance'] ?? 0;
                          _balanceController.text = _senderBalance.toString();
                          _showModal = true;
                        });
                      },
                      child: Text(_t['modify']!),
                    ),
                    TextButton(
                      onPressed: () => setState(() {
                        _deleteRowId = item['id'];
                        _showDeleteConfirm = true;
                      }),
                      child: Text(_t['delete']!, style: const TextStyle(color: Colors.red)),
                    ),
                  ],
                )),
              ])).toList(),
            ),
          ),
          if (_showModal) _buildModifyDialog(),
          if (_showDeleteConfirm) _buildDeleteDialog(),
        ],
      ),
    );
  }

  Widget _buildModifyDialog() {
    return AlertDialog(
      title: Text(_curRow?['address'] ?? ''),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(_t['modalTip']!),
          const SizedBox(height: 16),
          CheckboxListTile(
            title: Text(_t['enable']!),
            value: _senderEnabled,
            onChanged: (v) => setState(() => _senderEnabled = v ?? false),
          ),
          TextField(
            controller: _balanceController,
            decoration: const InputDecoration(border: OutlineInputBorder()),
            keyboardType: TextInputType.number,
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showModal = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: _loading ? null : _updateData,
          child: _loading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(_t['ok']!),
        ),
      ],
    );
  }

  Widget _buildDeleteDialog() {
    return AlertDialog(
      title: Text(_t['delete']!),
      content: Text(_t['deleteTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showDeleteConfirm = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: _doDelete,
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: Text(_t['delete']!),
        ),
      ],
    );
  }
}
