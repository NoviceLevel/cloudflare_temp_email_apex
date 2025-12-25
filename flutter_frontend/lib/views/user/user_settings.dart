import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class UserSettingsView extends StatefulWidget {
  const UserSettingsView({super.key});

  @override
  State<UserSettingsView> createState() => _UserSettingsViewState();
}

class _UserSettingsViewState extends State<UserSettingsView> {
  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _logout() async {
    final appState = context.read<AppState>();
    await appState.setUserJwt('');
    appState.setUserSettings(UserSettings());
    if (mounted) {
      context.go('/');
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    if (appState.userJwt.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.login,
              size: 48,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              appState.locale == 'zh' ? '请先登录用户账户' : 'Please login first',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 用户信息
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    appState.locale == 'zh' ? '用户信息' : 'User Info',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow(
                    appState.locale == 'zh' ? '用户邮箱' : 'User Email',
                    appState.userSettings.userEmail,
                  ),
                  _buildInfoRow(
                    appState.locale == 'zh' ? '用户ID' : 'User ID',
                    appState.userSettings.userId.toString(),
                  ),
                  _buildInfoRow(
                    appState.locale == 'zh' ? '管理员' : 'Admin',
                    appState.userSettings.isAdmin 
                        ? (appState.locale == 'zh' ? '是' : 'Yes')
                        : (appState.locale == 'zh' ? '否' : 'No'),
                  ),
                  if (appState.userSettings.userRole != null)
                    _buildInfoRow(
                      appState.locale == 'zh' ? '角色' : 'Role',
                      appState.userSettings.userRole!.role,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // 退出登录
          OutlinedButton.icon(
            onPressed: () => _showLogoutConfirm(),
            icon: const Icon(Icons.logout),
            label: Text(appState.locale == 'zh' ? '退出登录' : 'Logout'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 48),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  void _showLogoutConfirm() {
    final appState = context.read<AppState>();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(appState.locale == 'zh' ? '退出登录' : 'Logout'),
        content: Text(appState.locale == 'zh' ? '确定要退出登录吗？' : 'Are you sure to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(appState.locale == 'zh' ? '取消' : 'Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _logout();
            },
            child: Text(appState.locale == 'zh' ? '退出登录' : 'Logout'),
          ),
        ],
      ),
    );
  }
}
