import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';

class AdminSendBoxView extends StatelessWidget {
  const AdminSendBoxView({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.send,
            size: 48,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
          const SizedBox(height: 16),
          Text(
            appState.locale == 'zh' ? '发件箱管理' : 'Send Box Management',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            appState.locale == 'zh' 
                ? '请先在账户管理中选择一个地址'
                : 'Please select an address in Account Management first',
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
