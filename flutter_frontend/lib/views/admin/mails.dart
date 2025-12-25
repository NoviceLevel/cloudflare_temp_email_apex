import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';
import '../../components/mail_box.dart';

class AdminMailsView extends StatefulWidget {
  const AdminMailsView({super.key});

  @override
  State<AdminMailsView> createState() => _AdminMailsViewState();
}

class _AdminMailsViewState extends State<AdminMailsView> {
  String _addressFilter = '';
  int _mailBoxKey = 0;

  final _addressController = TextEditingController();

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'addressQueryTip': isZh ? '留空查询所有地址' : 'Leave blank to query all addresses',
      'query': isZh ? '查询' : 'Query',
    };
  }

  void _queryMail() {
    setState(() {
      _addressFilter = _addressController.text.trim();
      _mailBoxKey = DateTime.now().millisecondsSinceEpoch;
    });
  }

  Future<Map<String, dynamic>> _fetchMailData(int limit, int offset) async {
    final address = _addressFilter.isNotEmpty ? '&address=$_addressFilter' : '';
    return await Api.adminFetch('/admin/mails?limit=$limit&offset=$offset$address') ?? {};
  }

  Future<void> _deleteMail(int mailId) async {
    await Api.adminFetch('/admin/mails/$mailId', method: 'DELETE');
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              SizedBox(
                width: 300,
                child: TextField(
                  controller: _addressController,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(),
                    isDense: true,
                    hintText: _t['addressQueryTip'],
                  ),
                  onSubmitted: (_) => _queryMail(),
                ),
              ),
              const SizedBox(width: 8),
              FilledButton.tonal(onPressed: _queryMail, child: Text(_t['query']!)),
            ],
          ),
          const SizedBox(height: 16),
          Expanded(
            child: MailBoxWidget(
              key: ValueKey(_mailBoxKey),
              fetchMailData: _fetchMailData,
              deleteMail: _deleteMail,
              enableUserDeleteEmail: true,
              showFilterInput: true,
            ),
          ),
        ],
      ),
    );
  }
}
