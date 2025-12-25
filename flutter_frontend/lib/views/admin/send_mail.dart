import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class SendMailView extends StatefulWidget {
  const SendMailView({super.key});

  @override
  State<SendMailView> createState() => _SendMailViewState();
}

class _SendMailViewState extends State<SendMailView> {
  bool _loading = false;
  bool _isPreview = false;
  String _contentType = 'text';

  final _fromNameController = TextEditingController();
  final _fromMailController = TextEditingController();
  final _toNameController = TextEditingController();
  final _toMailController = TextEditingController();
  final _subjectController = TextEditingController();
  final _contentController = TextEditingController();

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'successSend': isZh ? '请查看您的发件箱, 如果失败, 请检查稍后重试。' : 'Please check your sendbox.',
      'fromName': isZh ? '你的名称和地址，名称不填写则使用邮箱地址' : 'Your Name and Address',
      'toName': isZh ? '收件人名称和地址，名称不填写则使用邮箱地址' : 'Recipient Name and Address',
      'subject': isZh ? '主题' : 'Subject',
      'options': isZh ? '选项' : 'Options',
      'edit': isZh ? '编辑' : 'Edit',
      'preview': isZh ? '预览' : 'Preview',
      'content': isZh ? '内容' : 'Content',
      'send': isZh ? '发送' : 'Send',
      'text': isZh ? '文本' : 'Text',
      'html': 'HTML',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _send() async {
    setState(() => _loading = true);
    try {
      await Api.adminFetch('/admin/send_mail', method: 'POST', body: {
        'from_name': _fromNameController.text,
        'from_mail': _fromMailController.text,
        'to_name': _toNameController.text,
        'to_mail': _toMailController.text,
        'subject': _subjectController.text,
        'is_html': _contentType != 'text',
        'content': _contentController.text,
      });
      _showMessage(_t['successSend']!);
      // Clear form
      _fromNameController.clear();
      _fromMailController.clear();
      _toNameController.clear();
      _toMailController.clear();
      _subjectController.clear();
      _contentController.clear();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      FilledButton(
                        onPressed: _loading ? null : _send,
                        child: _loading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text(_t['send']!),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(_t['fromName']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _fromNameController,
                          decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, hintText: 'Name'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _fromMailController,
                          decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, hintText: 'Email'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(_t['toName']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _toNameController,
                          decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, hintText: 'Name'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _toMailController,
                          decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true, hintText: 'Email'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(_t['subject']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _subjectController,
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  ),
                  const SizedBox(height: 16),
                  Text(_t['options']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      ChoiceChip(
                        label: Text(_t['text']!),
                        selected: _contentType == 'text',
                        onSelected: (_) => setState(() => _contentType = 'text'),
                      ),
                      ChoiceChip(
                        label: Text(_t['html']!),
                        selected: _contentType == 'html',
                        onSelected: (_) => setState(() => _contentType = 'html'),
                      ),
                      if (_contentType != 'text')
                        OutlinedButton(
                          onPressed: () => setState(() => _isPreview = !_isPreview),
                          child: Text(_isPreview ? _t['edit']! : _t['preview']!),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(_t['content']!, style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  if (_isPreview && _contentType != 'text')
                    Card(
                      color: Colors.grey.shade100,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: SelectableText(_contentController.text),
                      ),
                    )
                  else
                    TextField(
                      controller: _contentController,
                      decoration: const InputDecoration(border: OutlineInputBorder()),
                      maxLines: 10,
                      minLines: 5,
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
