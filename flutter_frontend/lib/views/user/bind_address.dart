import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../common/login.dart';

class BindAddressView extends StatelessWidget {
  const BindAddressView({super.key});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final userEmail = appState.userSettings.userEmail;

    if (userEmail == null || userEmail.toString().isEmpty) {
      return const SizedBox.shrink();
    }

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600),
        child: const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: LoginView(),
          ),
        ),
      ),
    );
  }
}
