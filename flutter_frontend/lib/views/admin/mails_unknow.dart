import 'package:flutter/material.dart';
import '../../api/index.dart';
import '../../components/mail_box.dart';

class MailsUnknowView extends StatelessWidget {
  const MailsUnknowView({super.key});

  Future<Map<String, dynamic>> _fetchMailData(int limit, int offset) async {
    return await Api.adminFetch('/admin/mails_unknow?limit=$limit&offset=$offset') ?? {};
  }

  Future<void> _deleteMail(int mailId) async {
    await Api.adminFetch('/admin/mails/$mailId', method: 'DELETE');
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: MailBoxWidget(
        fetchMailData: _fetchMailData,
        deleteMail: _deleteMail,
        enableUserDeleteEmail: true,
      ),
    );
  }
}
