import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class DatabaseManagerView extends StatefulWidget {
  const DatabaseManagerView({super.key});

  @override
  State<DatabaseManagerView> createState() => _DatabaseManagerViewState();
}

class _DatabaseManagerViewState extends State<DatabaseManagerView> {
  bool _loading = false;
  Map<String, dynamic> _dbVersionData = {
    'need_initialization': false,
    'need_migration': false,
    'current_db_version': '',
    'code_db_version': ''
  };

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'needInitTip': isZh ? '需要初始化数据库，请初始化数据库' : 'Database initialization is required.',
      'needMigrationTip': isZh ? '需要迁移数据库，请迁移数据库' : 'Database migration is required.',
      'currentDbVersion': isZh ? '当前数据库版本' : 'Current DB Version',
      'codeDbVersion': isZh ? '需要的数据库版本' : 'Code Needed DB Version',
      'init': isZh ? '初始化数据库' : 'Initialize Database',
      'migration': isZh ? '升级数据库 Schema' : 'Migrate Database',
      'initSuccess': isZh ? '数据库初始化成功' : 'Database initialized successfully',
      'migrationSuccess': isZh ? '数据库升级成功' : 'Database migrated successfully',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/db_version');
      if (res != null) setState(() => _dbVersionData = res);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _initialization() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/db_initialize', method: 'POST');
      await _fetchData();
      _showMessage(_t['initSuccess']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _migration() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/db_migration', method: 'POST');
      await _fetchData();
      _showMessage(_t['migrationSuccess']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 800),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (_dbVersionData['need_initialization'] == true)
                  Card(
                    color: Colors.orange.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.warning, color: Colors.orange),
                              const SizedBox(width: 8),
                              Expanded(child: Text(_t['needInitTip']!)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: _loading ? null : _initialization,
                              child: _loading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                  : Text(_t['init']!),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (_dbVersionData['need_migration'] == true)
                  Card(
                    color: Colors.orange.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.warning, color: Colors.orange),
                              const SizedBox(width: 8),
                              Expanded(child: Text(_t['needMigrationTip']!)),
                            ],
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: _loading ? null : _migration,
                              child: _loading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                                  : Text(_t['migration']!),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                Card(
                  color: Colors.blue.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.info, color: Colors.blue),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '${_t['currentDbVersion']}: ${_dbVersionData['current_db_version'] ?? 'unknown'}, '
                            '${_t['codeDbVersion']}: ${_dbVersionData['code_db_version'] ?? ''}',
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
