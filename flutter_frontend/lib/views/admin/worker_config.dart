import 'package:flutter/material.dart';
import 'dart:convert';
import '../../api/index.dart';

class WorkerConfigView extends StatefulWidget {
  const WorkerConfigView({super.key});

  @override
  State<WorkerConfigView> createState() => _WorkerConfigViewState();
}

class _WorkerConfigViewState extends State<WorkerConfigView> {
  Map<String, dynamic> _settings = {};

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchData() async {
    try {
      final res = await Api.adminFetch('/admin/worker/configs');
      if (res != null) setState(() => _settings = res);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 800),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: SelectableText(
                const JsonEncoder.withIndent('  ').convert(_settings),
                style: const TextStyle(fontFamily: 'monospace'),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
