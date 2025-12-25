import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';
import '../../components/mail_box.dart';

class UserMailBoxView extends StatefulWidget {
  const UserMailBoxView({super.key});

  @override
  State<UserMailBoxView> createState() => _UserMailBoxViewState();
}

class _UserMailBoxViewState extends State<UserMailBoxView> {
  String? _addressFilter;
  List<Map<String, dynamic>> _addressOptions = [];
  int _mailBoxKey = 0;

  @override
  void initState() {
    super.initState();
    _fetchAddressData();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'addressQueryTip': isZh ? '留空查询所有地址' : 'Leave blank to query all addresses',
      'query': isZh ? '查询' : 'Query',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _fetchAddressData() async {
    try {
      final res = await Api.instance.fetch('/user_api/bind_address');
      if (res != null) {
        setState(() {
          _addressOptions = List<Map<String, dynamic>>.from(res['results'] ?? []);
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  void _queryMail() {
    setState(() {
      _mailBoxKey = DateTime.now().millisecondsSinceEpoch;
    });
  }

  Future<Map<String, dynamic>> _fetchMailData(int limit, int offset) async {
    final address = _addressFilter != null && _addressFilter!.isNotEmpty ? '&address=$_addressFilter' : '';
    return await Api.instance.fetch('/user_api/mails?limit=$limit&offset=$offset$address') ?? {};
  }

  Future<void> _deleteMail(int mailId) async {
    await Api.instance.fetch('/user_api/mails/$mailId', method: 'DELETE');
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
                child: DropdownButtonFormField<String>(
                  value: _addressFilter,
                  decoration: InputDecoration(
                    border: const OutlineInputBorder(),
                    isDense: true,
                    labelText: _t['addressQueryTip'],
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: Text('All')),
                    ..._addressOptions.map((item) => DropdownMenuItem(
                      value: item['name'],
                      child: Text(item['name'] ?? ''),
                    )),
                  ],
                  onChanged: (v) {
                    setState(() => _addressFilter = v);
                    _queryMail();
                  },
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
