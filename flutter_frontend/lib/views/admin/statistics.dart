import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class AdminStatisticsView extends StatefulWidget {
  const AdminStatisticsView({super.key});

  @override
  State<AdminStatisticsView> createState() => _AdminStatisticsViewState();
}

class _AdminStatisticsViewState extends State<AdminStatisticsView> {
  int _userCount = 0;
  int _addressCount = 0;
  int _activeAddressCount7days = 0;
  int _activeAddressCount30days = 0;
  int _mailCount = 0;
  int _sendMailCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchStatistics();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'userCount': isZh ? '用户总数' : 'User Count',
      'addressCount': isZh ? '邮箱地址总数' : 'Address Count',
      'activeAddressCount7days': isZh ? '7天活跃邮箱地址总数' : '7 days Active Address Count',
      'activeAddressCount30days': isZh ? '30天活跃邮箱地址总数' : '30 days Active Address Count',
      'mailCount': isZh ? '邮件总数' : 'Mail Count',
      'sendMailCount': isZh ? '发送邮件总数' : 'Send Mail Count',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchStatistics() async {
    try {
      final res = await Api.adminFetch('/admin/statistics');
      if (res != null) {
        setState(() {
          _userCount = res['userCount'] ?? 0;
          _addressCount = res['addressCount'] ?? 0;
          _activeAddressCount7days = res['activeAddressCount7days'] ?? 0;
          _activeAddressCount30days = res['activeAddressCount30days'] ?? 0;
          _mailCount = res['mailCount'] ?? 0;
          _sendMailCount = res['sendMailCount'] ?? 0;
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Widget _buildStatCard(IconData icon, Color color, String value, String label) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 4),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // First row - Address stats
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      Icons.person,
                      Colors.blue,
                      _addressCount.toString(),
                      _t['addressCount']!,
                    ),
                  ),
                  Expanded(
                    child: _buildStatCard(
                      Icons.check_circle,
                      Colors.green,
                      _activeAddressCount7days.toString(),
                      _t['activeAddressCount7days']!,
                    ),
                  ),
                  Expanded(
                    child: _buildStatCard(
                      Icons.check_circle,
                      Colors.green,
                      _activeAddressCount30days.toString(),
                      _t['activeAddressCount30days']!,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Second row - User and mail stats
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      Icons.group,
                      Colors.blue,
                      _userCount.toString(),
                      _t['userCount']!,
                    ),
                  ),
                  Expanded(
                    child: _buildStatCard(
                      Icons.email,
                      Colors.cyan,
                      _mailCount.toString(),
                      _t['mailCount']!,
                    ),
                  ),
                  Expanded(
                    child: _buildStatCard(
                      Icons.send,
                      Colors.orange,
                      _sendMailCount.toString(),
                      _t['sendMailCount']!,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
