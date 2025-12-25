import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';
import 'user_login.dart';

class UserBarView extends StatefulWidget {
  const UserBarView({super.key});

  @override
  State<UserBarView> createState() => _UserBarViewState();
}

class _UserBarViewState extends State<UserBarView> {
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchUserSettings();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'currentUser': isZh ? '当前登录用户' : 'Current Login User',
      'fetchUserSettingsError': isZh 
          ? '登录信息已过期或账号不存在，也可能是网络连接异常，请稍后再尝试。' 
          : 'Login password is invalid or account not exist.',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchUserSettings() async {
    final appState = context.read<AppState>();
    try {
      // Fetch user open settings
      final openRes = await Api.instance.fetch('/user_api/open_settings');
      if (openRes != null) {
        appState.setUserOpenSettings(openRes);
      }
      // Fetch user settings if logged in
      if (appState.userJwt.isNotEmpty) {
        final res = await Api.instance.fetch('/user_api/settings');
        if (res != null) {
          appState.setUserSettings(res);
        }
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final userEmail = appState.userSettings.userEmail;
    final userJwt = appState.userJwt;

    if (_loading) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(48),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    if (userEmail != null && userEmail.toString().isNotEmpty) {
      return Card(
        color: Colors.green.shade50,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle, color: Colors.green),
              const SizedBox(width: 8),
              Text(
                '${_t['currentUser']}: $userEmail',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      );
    }

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (userJwt.isNotEmpty)
                  Card(
                    color: Colors.orange.shade50,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          const Icon(Icons.warning, color: Colors.orange),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_t['fetchUserSettingsError']!)),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                const UserLoginView(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
