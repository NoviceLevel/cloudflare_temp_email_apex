import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class UserManagementView extends StatefulWidget {
  const UserManagementView({super.key});

  @override
  State<UserManagementView> createState() => _UserManagementViewState();
}

class _UserManagementViewState extends State<UserManagementView> {
  bool _loading = false;
  List<Map<String, dynamic>> _data = [];
  List<Map<String, dynamic>> _userRoles = [];
  int _count = 0;
  int _page = 1;
  final int _pageSize = 20;
  String _userQuery = '';

  int? _curUserId;
  bool _showResetPassword = false;
  bool _showDeleteUser = false;
  bool _showCreateUser = false;
  bool _showChangeRole = false;
  String _newPassword = '';
  String _curUserRole = '';
  String _newUserEmail = '';
  String _newUserPassword = '';

  final _queryController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailController = TextEditingController();
  final _newPasswordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchUserRoles();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'success': isZh ? '成功' : 'Success',
      'userEmail': isZh ? '用户邮箱' : 'User Email',
      'role': isZh ? '角色' : 'Role',
      'addressCount': isZh ? '地址数量' : 'Address Count',
      'createdAt': isZh ? '创建时间' : 'Created At',
      'actions': isZh ? '操作' : 'Actions',
      'query': isZh ? '查询' : 'Query',
      'itemCount': isZh ? '总数' : 'itemCount',
      'deleteUser': isZh ? '删除用户' : 'Delete User',
      'delete': isZh ? '删除' : 'Delete',
      'deleteUserTip': isZh ? '确定要删除此用户吗？' : 'Are you sure you want to delete this user?',
      'resetPassword': isZh ? '重置密码' : 'Reset Password',
      'pleaseInput': isZh ? '请输入完整信息' : 'Please input complete information',
      'createUser': isZh ? '创建用户' : 'Create User',
      'email': isZh ? '邮箱' : 'Email',
      'password': isZh ? '密码' : 'Password',
      'changeRole': isZh ? '更改角色' : 'Change Role',
      'cancel': isZh ? '取消' : 'Cancel',
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
        setState(() => _userRoles = List<Map<String, dynamic>>.from(res));
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _fetchData() async {
    try {
      final query = _queryController.text.trim();
      final res = await Api.adminFetch(
        '/admin/users?limit=$_pageSize&offset=${(_page - 1) * _pageSize}${query.isNotEmpty ? '&query=$query' : ''}'
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

  Future<void> _resetPassword() async {
    if (_passwordController.text.isEmpty) {
      _showMessage(_t['pleaseInput']!, isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/users/$_curUserId/reset_password', method: 'POST', body: {
        'password': _passwordController.text,
      });
      _showMessage(_t['success']!);
      setState(() => _showResetPassword = false);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createUser() async {
    if (_emailController.text.isEmpty || _newPasswordController.text.isEmpty) {
      _showMessage(_t['pleaseInput']!, isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/users', method: 'POST', body: {
        'email': _emailController.text,
        'password': _newPasswordController.text,
      });
      _showMessage(_t['success']!);
      await _fetchData();
      setState(() => _showCreateUser = false);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteUser() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/users/$_curUserId', method: 'DELETE');
      _showMessage(_t['success']!);
      setState(() => _showDeleteUser = false);
      await _fetchData();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _changeRole() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/user_roles', method: 'POST', body: {
        'user_id': _curUserId,
        'role_text': _curUserRole,
      });
      _showMessage(_t['success']!);
      setState(() => _showChangeRole = false);
      await _fetchData();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
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
                  controller: _queryController,
                  decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  onSubmitted: (_) => _fetchData(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.tonal(onPressed: _fetchData, child: Text(_t['query']!)),
            ],
          ),
          const SizedBox(height: 16),
          // Pagination & Create
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
              const SizedBox(width: 16),
              FilledButton.tonal(
                onPressed: () => setState(() => _showCreateUser = true),
                child: Text(_t['createUser']!),
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
                DataColumn(label: Text(_t['userEmail']!)),
                DataColumn(label: Text(_t['role']!)),
                DataColumn(label: Text(_t['addressCount']!)),
                DataColumn(label: Text(_t['createdAt']!)),
                DataColumn(label: Text(_t['actions']!)),
              ],
              rows: _data.map((item) => DataRow(cells: [
                DataCell(Text(item['id'].toString())),
                DataCell(Text(item['user_email'] ?? '')),
                DataCell(item['role_text'] != null 
                    ? Chip(label: Text(item['role_text']), backgroundColor: Colors.blue.shade100)
                    : const Text('-')),
                DataCell(Text(item['address_count']?.toString() ?? '0')),
                DataCell(Text(item['created_at'] ?? '')),
                DataCell(PopupMenuButton<String>(
                  onSelected: (value) {
                    setState(() => _curUserId = item['id']);
                    switch (value) {
                      case 'changeRole':
                        setState(() {
                          _curUserRole = item['role_text'] ?? '';
                          _showChangeRole = true;
                        });
                        break;
                      case 'resetPassword':
                        _passwordController.clear();
                        setState(() => _showResetPassword = true);
                        break;
                      case 'delete':
                        setState(() => _showDeleteUser = true);
                        break;
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(value: 'changeRole', child: Text(_t['changeRole']!)),
                    PopupMenuItem(value: 'resetPassword', child: Text(_t['resetPassword']!)),
                    PopupMenuItem(value: 'delete', child: Text(_t['delete']!)),
                  ],
                )),
              ])).toList(),
            ),
          ),
          if (_showCreateUser) _buildCreateUserDialog(),
          if (_showResetPassword) _buildResetPasswordDialog(),
          if (_showDeleteUser) _buildDeleteUserDialog(),
          if (_showChangeRole) _buildChangeRoleDialog(),
        ],
      ),
    );
  }

  Widget _buildCreateUserDialog() {
    return AlertDialog(
      title: Text(_t['createUser']!),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(
            controller: _emailController,
            decoration: InputDecoration(labelText: _t['email'], border: const OutlineInputBorder()),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _newPasswordController,
            obscureText: true,
            decoration: InputDecoration(labelText: _t['password'], border: const OutlineInputBorder()),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showCreateUser = false), child: Text(_t['cancel']!)),
        FilledButton(onPressed: _loading ? null : _createUser, child: Text(_t['createUser']!)),
      ],
    );
  }

  Widget _buildResetPasswordDialog() {
    return AlertDialog(
      title: Text(_t['resetPassword']!),
      content: TextField(
        controller: _passwordController,
        obscureText: true,
        decoration: InputDecoration(labelText: _t['password'], border: const OutlineInputBorder()),
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showResetPassword = false), child: Text(_t['cancel']!)),
        FilledButton(onPressed: _loading ? null : _resetPassword, child: Text(_t['resetPassword']!)),
      ],
    );
  }

  Widget _buildDeleteUserDialog() {
    return AlertDialog(
      title: Text(_t['deleteUser']!),
      content: Text(_t['deleteUserTip']!),
      actions: [
        TextButton(onPressed: () => setState(() => _showDeleteUser = false), child: Text(_t['cancel']!)),
        FilledButton(
          onPressed: _loading ? null : _deleteUser,
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          child: Text(_t['deleteUser']!),
        ),
      ],
    );
  }

  Widget _buildChangeRoleDialog() {
    return AlertDialog(
      title: Text(_t['changeRole']!),
      content: DropdownButtonFormField<String>(
        value: _curUserRole.isNotEmpty ? _curUserRole : null,
        decoration: const InputDecoration(border: OutlineInputBorder()),
        items: [
          const DropdownMenuItem(value: '', child: Text('-')),
          ..._userRoles.map((r) => DropdownMenuItem(value: r['role'], child: Text(r['role'] ?? ''))),
        ],
        onChanged: (v) => setState(() => _curUserRole = v ?? ''),
      ),
      actions: [
        TextButton(onPressed: () => setState(() => _showChangeRole = false), child: Text(_t['cancel']!)),
        FilledButton(onPressed: _loading ? null : _changeRole, child: Text(_t['changeRole']!)),
      ],
    );
  }
}
