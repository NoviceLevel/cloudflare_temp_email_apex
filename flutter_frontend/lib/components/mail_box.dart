import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../store/index.dart';
import '../api/index.dart';
import '../utils/index.dart';
import 'mail_content_renderer.dart';

// Generic MailBoxWidget that accepts custom fetch/delete functions
class MailBoxWidget extends StatefulWidget {
  final Future<Map<String, dynamic>> Function(int limit, int offset)? fetchMailData;
  final Future<void> Function(int mailId)? deleteMail;
  final bool showEmailTo;
  final bool showReply;
  final bool showSaveS3;
  final bool enableUserDeleteEmail;
  final bool showFilterInput;

  const MailBoxWidget({
    super.key,
    this.fetchMailData,
    this.deleteMail,
    this.showEmailTo = true,
    this.showReply = false,
    this.showSaveS3 = false,
    this.enableUserDeleteEmail = false,
    this.showFilterInput = false,
  });

  @override
  State<MailBoxWidget> createState() => _MailBoxWidgetState();
}

class _MailBoxWidgetState extends State<MailBoxWidget> {
  List<Email> _mails = [];
  Email? _currentMail;
  int _page = 1;
  int _count = 0;
  final int _pageSize = 20;
  bool _isLoading = false;
  String _filterKeyword = '';
  Timer? _autoRefreshTimer;
  int _autoRefreshCountdown = 60;
  bool _multiActionMode = false;

  @override
  void initState() {
    super.initState();
    _loadMails();
    _setupAutoRefresh();
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  void _setupAutoRefresh() {
    final appState = context.read<AppState>();
    _autoRefreshCountdown = appState.autoRefreshInterval;
    
    _autoRefreshTimer?.cancel();
    if (appState.autoRefresh) {
      _autoRefreshTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_isLoading) return;
        setState(() {
          _autoRefreshCountdown--;
          if (_autoRefreshCountdown <= 0) {
            _autoRefreshCountdown = appState.autoRefreshInterval;
            _page = 1;
            _loadMails();
          }
        });
      });
    }
  }

  Future<void> _loadMails() async {
    setState(() => _isLoading = true);
    try {
      if (widget.fetchMailData != null) {
        // Use custom fetch function
        final data = await widget.fetchMailData!(_pageSize, (_page - 1) * _pageSize);
        final results = (data['results'] as List?)?.map((e) => Email.fromJson(e)).toList() ?? [];
        setState(() {
          _mails = results;
          if ((data['count'] ?? 0) > 0) _count = data['count'];
          if (!isMobile(context) && _mails.isNotEmpty && _currentMail == null) {
            _currentMail = _mails.first;
          }
        });
      } else {
        // Use default API
        final result = await Api.instance.getMails(
          limit: _pageSize,
          offset: (_page - 1) * _pageSize,
        );
        setState(() {
          _mails = result.results;
          if (result.count > 0) _count = result.count;
          if (!isMobile(context) && _mails.isNotEmpty && _currentMail == null) {
            _currentMail = _mails.first;
          }
        });
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  List<Email> get _filteredMails {
    if (_filterKeyword.isEmpty) return _mails;
    final keyword = _filterKeyword.toLowerCase();
    return _mails.where((mail) {
      return mail.subject.toLowerCase().contains(keyword) ||
          (mail.text?.toLowerCase().contains(keyword) ?? false) ||
          (mail.message?.toLowerCase().contains(keyword) ?? false);
    }).toList();
  }

  Future<void> _deleteMail() async {
    if (_currentMail == null) return;
    try {
      if (widget.deleteMail != null) {
        await widget.deleteMail!(_currentMail!.id);
      } else {
        await Api.instance.deleteMail(_currentMail!.id);
      }
      _showMessage('删除成功');
      setState(() => _currentMail = null);
      await _loadMails();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  void _replyMail() {
    if (_currentMail == null) return;
    final appState = context.read<AppState>();
    final l = AppLocalizations(appState.locale);
    
    // 解析发件人
    String toMail = _currentMail!.source;
    String toName = '';
    final match = RegExp(r'(.+?) <(.+?)>').firstMatch(_currentMail!.source);
    if (match != null) {
      toName = match.group(1) ?? '';
      toMail = match.group(2) ?? _currentMail!.source;
    }
    
    appState.setSendMailModel(SendMailModel(
      toName: toName,
      toMail: toMail,
      subject: '${l.get('reply')}: ${_currentMail!.subject}',
      contentType: 'rich',
      content: _currentMail!.text != null 
          ? '<p><br></p><blockquote>${_currentMail!.text}</blockquote>' 
          : '',
    ));
    appState.setIndexTab('sendmail');
  }

  void _forwardMail() {
    if (_currentMail == null) return;
    final appState = context.read<AppState>();
    final l = AppLocalizations(appState.locale);
    
    appState.setSendMailModel(SendMailModel(
      subject: '${l.get('forward')}: ${_currentMail!.subject}',
      contentType: _currentMail!.message != null ? 'html' : 'text',
      content: _currentMail!.message ?? _currentMail!.text ?? '',
    ));
    appState.setIndexTab('sendmail');
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final l = AppLocalizations(appState.locale);
    final isMobileView = isMobile(context);

    return isMobileView ? _buildMobileView(appState, l) : _buildDesktopView(appState, l);
  }

  Widget _buildDesktopView(AppState appState, AppLocalizations l) {
    return Column(
      children: [
        // 工具栏
        _buildToolbar(appState, l),
        const SizedBox(height: 16),
        // 邮件列表和预览
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 邮件列表
              SizedBox(
                width: 280,
                child: _buildMailList(l),
              ),
              const SizedBox(width: 16),
              // 邮件预览
              Expanded(
                child: _buildMailPreview(appState, l),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMobileView(AppState appState, AppLocalizations l) {
    return Column(
      children: [
        // 工具栏
        _buildMobileToolbar(appState, l),
        const SizedBox(height: 8),
        // 过滤输入
        if (widget.showFilterInput)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: l.get('keywordQueryTip'),
                border: const OutlineInputBorder(),
                isDense: true,
                suffixIcon: _filterKeyword.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _filterKeyword = ''),
                      )
                    : null,
              ),
              onChanged: (value) => setState(() => _filterKeyword = value),
            ),
          ),
        // 邮件列表
        Expanded(
          child: _buildMailList(l),
        ),
      ],
    );
  }

  Widget _buildToolbar(AppState appState, AppLocalizations l) {
    if (_multiActionMode) {
      return Row(
        children: [
          TextButton(
            onPressed: () => setState(() {
              _multiActionMode = false;
              for (var mail in _mails) {
                mail.checked = false;
              }
            }),
            child: Text(l.get('cancelMultiAction')),
          ),
          TextButton(
            onPressed: () {
              for (var mail in _mails) {
                mail.checked = true;
              }
              setState(() {});
            },
            child: Text(l.get('selectAll')),
          ),
          TextButton(
            onPressed: () {
              for (var mail in _mails) {
                mail.checked = false;
              }
              setState(() {});
            },
            child: Text(l.get('unselectAll')),
          ),
          if (widget.enableUserDeleteEmail)
            TextButton(
              onPressed: _deleteSelectedMails,
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: Text(l.get('delete')),
            ),
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.download),
            label: Text(l.get('download')),
          ),
        ],
      );
    }

    return Row(
      children: [
        TextButton(
          onPressed: () => setState(() => _multiActionMode = true),
          child: Text(l.get('multiAction')),
        ),
        // 分页
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: _page > 1 ? () {
                setState(() => _page--);
                _loadMails();
              } : null,
            ),
            Text('$_page / ${(_count / _pageSize).ceil().clamp(1, 999)}'),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: _page < (_count / _pageSize).ceil() ? () {
                setState(() => _page++);
                _loadMails();
              } : null,
            ),
          ],
        ),
        // 自动刷新
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Switch(
              value: appState.autoRefresh,
              onChanged: (value) {
                appState.setAutoRefresh(value);
                _setupAutoRefresh();
              },
            ),
            Text(appState.autoRefresh 
                ? l.getWithParam('refreshAfter', {'msg': '$_autoRefreshCountdown'})
                : l.get('autoRefresh')),
          ],
        ),
        TextButton(
          onPressed: () {
            _page = 1;
            _loadMails();
          },
          child: Text(l.get('refresh')),
        ),
        // 过滤输入
        if (widget.showFilterInput)
          SizedBox(
            width: 200,
            child: TextField(
              decoration: InputDecoration(
                hintText: l.get('keywordQueryTip'),
                border: const OutlineInputBorder(),
                isDense: true,
                suffixIcon: _filterKeyword.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _filterKeyword = ''),
                      )
                    : null,
              ),
              onChanged: (value) => setState(() => _filterKeyword = value),
            ),
          ),
      ],
    );
  }

  Widget _buildMobileToolbar(AppState appState, AppLocalizations l) {
    return Row(
      children: [
        // 分页
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              iconSize: 20,
              onPressed: _page > 1 ? () {
                setState(() => _page--);
                _loadMails();
              } : null,
            ),
            Text('$_page/${(_count / _pageSize).ceil().clamp(1, 999)}', style: const TextStyle(fontSize: 12)),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              iconSize: 20,
              onPressed: _page < (_count / _pageSize).ceil() ? () {
                setState(() => _page++);
                _loadMails();
              } : null,
            ),
          ],
        ),
        // 自动刷新
        Switch(
          value: appState.autoRefresh,
          onChanged: (value) {
            appState.setAutoRefresh(value);
            _setupAutoRefresh();
          },
        ),
        Text(appState.autoRefresh ? '${_autoRefreshCountdown}s' : l.get('autoRefresh'), 
            style: const TextStyle(fontSize: 12)),
        TextButton(
          onPressed: () {
            _page = 1;
            _loadMails();
          },
          child: Text(l.get('refresh'), style: const TextStyle(fontSize: 12)),
        ),
      ],
    );
  }

  Widget _buildMailList(AppLocalizations l) {
    final mails = _filteredMails;
    
    if (_isLoading && mails.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (mails.isEmpty) {
      return Center(child: Text(l.get('noData')));
    }

    return ListView.builder(
      itemCount: mails.length,
      itemBuilder: (context, index) {
        final mail = mails[index];
        final isSelected = _currentMail?.id == mail.id;
        final appState = context.read<AppState>();

        return ListTile(
          selected: isSelected,
          selectedTileColor: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
          leading: _multiActionMode
              ? Checkbox(
                  value: mail.checked,
                  onChanged: (value) {
                    setState(() => mail.checked = value ?? false);
                  },
                )
              : null,
          title: Text(
            mail.subject,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ID: ${mail.id} | ${utcToLocalDate(mail.createdAt, appState.useUTCDate)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                mail.source,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          onTap: () {
            if (_multiActionMode) {
              setState(() => mail.checked = !mail.checked);
            } else {
              setState(() => _currentMail = mail);
              if (isMobile(context)) {
                _showMailBottomSheet(mail);
              }
            }
          },
        );
      },
    );
  }

  Widget _buildMailPreview(AppState appState, AppLocalizations l) {
    if (_currentMail == null) {
      return Card(
        child: Center(
          child: Text(l.get('pleaseSelectMail')),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 上一封/下一封
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton.icon(
              onPressed: _canGoPrev ? _prevMail : null,
              icon: const Icon(Icons.chevron_left),
              label: Text(l.get('prevMail')),
            ),
            TextButton.icon(
              onPressed: _canGoNext ? _nextMail : null,
              icon: const Icon(Icons.chevron_right),
              label: Text(l.get('nextMail')),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // 邮件标题
        Text(
          _currentMail!.subject,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const Divider(),
        // 邮件内容
        Expanded(
          child: SingleChildScrollView(
            child: MailContentRenderer(
              mail: _currentMail!,
              showEmailTo: widget.showEmailTo,
              enableUserDeleteEmail: widget.enableUserDeleteEmail,
              showReply: widget.showReply,
              showSaveS3: widget.showSaveS3,
              onDelete: _deleteMail,
              onReply: _replyMail,
              onForward: _forwardMail,
            ),
          ),
        ),
      ],
    );
  }

  bool get _canGoPrev {
    if (_currentMail == null) return false;
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    return index > 0 || _page > 1;
  }

  bool get _canGoNext {
    if (_currentMail == null) return false;
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    return index < _filteredMails.length - 1 || _count > _page * _pageSize;
  }

  void _prevMail() {
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    if (index > 0) {
      setState(() => _currentMail = _filteredMails[index - 1]);
    } else if (_page > 1) {
      _page--;
      _loadMails().then((_) {
        if (_filteredMails.isNotEmpty) {
          setState(() => _currentMail = _filteredMails.last);
        }
      });
    }
  }

  void _nextMail() {
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    if (index < _filteredMails.length - 1) {
      setState(() => _currentMail = _filteredMails[index + 1]);
    } else if (_count > _page * _pageSize) {
      _page++;
      _loadMails().then((_) {
        if (_filteredMails.isNotEmpty) {
          setState(() => _currentMail = _filteredMails.first);
        }
      });
    }
  }

  void _showMailBottomSheet(Email mail) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            // 标题栏
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      mail.subject,
                      style: Theme.of(context).textTheme.titleMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // 邮件内容
            Expanded(
              child: SingleChildScrollView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                child: MailContentRenderer(
                  mail: mail,
                  showEmailTo: widget.showEmailTo,
                  enableUserDeleteEmail: widget.enableUserDeleteEmail,
                  showReply: widget.showReply,
                  showSaveS3: widget.showSaveS3,
                  onDelete: () {
                    Navigator.pop(context);
                    _deleteMail();
                  },
                  onReply: () {
                    Navigator.pop(context);
                    _replyMail();
                  },
                  onForward: () {
                    Navigator.pop(context);
                    _forwardMail();
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteSelectedMails() async {
    final selectedMails = _mails.where((m) => m.checked).toList();
    if (selectedMails.isEmpty) {
      _showMessage('请选择邮件', isError: true);
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除'),
        content: Text('确定删除 ${selectedMails.length} 封邮件?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    for (final mail in selectedMails) {
      try {
        if (widget.deleteMail != null) {
          await widget.deleteMail!(mail.id);
        } else {
          await Api.instance.deleteMail(mail.id);
        }
      } catch (e) {
        debugPrint('Delete mail ${mail.id} error: $e');
      }
    }
    _showMessage('删除成功');
    await _loadMails();
    setState(() => _multiActionMode = false);
  }
}

// Keep the old MailBoxView for backward compatibility
class MailBoxView extends StatefulWidget {
  final bool showEmailTo;
  final bool showReply;
  final bool showSaveS3;
  final bool enableUserDeleteEmail;
  final bool showFilterInput;

  const MailBoxView({
    super.key,
    this.showEmailTo = true,
    this.showReply = false,
    this.showSaveS3 = false,
    this.enableUserDeleteEmail = false,
    this.showFilterInput = false,
  });

  @override
  State<MailBoxView> createState() => _MailBoxViewState();
}

class _MailBoxViewState extends State<MailBoxView> {
  List<Email> _mails = [];
  Email? _currentMail;
  int _page = 1;
  int _count = 0;
  final int _pageSize = 20;
  bool _isLoading = false;
  String _filterKeyword = '';
  Timer? _autoRefreshTimer;
  int _autoRefreshCountdown = 60;
  bool _multiActionMode = false;

  @override
  void initState() {
    super.initState();
    _loadMails();
    _setupAutoRefresh();
  }

  @override
  void dispose() {
    _autoRefreshTimer?.cancel();
    super.dispose();
  }

  void _setupAutoRefresh() {
    final appState = context.read<AppState>();
    _autoRefreshCountdown = appState.autoRefreshInterval;
    
    _autoRefreshTimer?.cancel();
    if (appState.autoRefresh) {
      _autoRefreshTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (_isLoading) return;
        setState(() {
          _autoRefreshCountdown--;
          if (_autoRefreshCountdown <= 0) {
            _autoRefreshCountdown = appState.autoRefreshInterval;
            _page = 1;
            _loadMails();
          }
        });
      });
    }
  }

  Future<void> _loadMails() async {
    setState(() => _isLoading = true);
    try {
      final result = await Api.instance.getMails(
        limit: _pageSize,
        offset: (_page - 1) * _pageSize,
      );
      setState(() {
        _mails = result.results;
        if (result.count > 0) _count = result.count;
        if (!isMobile(context) && _mails.isNotEmpty && _currentMail == null) {
          _currentMail = _mails.first;
        }
      });
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  List<Email> get _filteredMails {
    if (_filterKeyword.isEmpty) return _mails;
    final keyword = _filterKeyword.toLowerCase();
    return _mails.where((mail) {
      return mail.subject.toLowerCase().contains(keyword) ||
          (mail.text?.toLowerCase().contains(keyword) ?? false) ||
          (mail.message?.toLowerCase().contains(keyword) ?? false);
    }).toList();
  }

  Future<void> _deleteMail() async {
    if (_currentMail == null) return;
    try {
      await Api.instance.deleteMail(_currentMail!.id);
      _showMessage('删除成功');
      setState(() => _currentMail = null);
      await _loadMails();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  void _replyMail() {
    if (_currentMail == null) return;
    final appState = context.read<AppState>();
    final l = AppLocalizations(appState.locale);
    
    // 解析发件人
    String toMail = _currentMail!.source;
    String toName = '';
    final match = RegExp(r'(.+?) <(.+?)>').firstMatch(_currentMail!.source);
    if (match != null) {
      toName = match.group(1) ?? '';
      toMail = match.group(2) ?? _currentMail!.source;
    }
    
    appState.setSendMailModel(SendMailModel(
      toName: toName,
      toMail: toMail,
      subject: '${l.get('reply')}: ${_currentMail!.subject}',
      contentType: 'rich',
      content: _currentMail!.text != null 
          ? '<p><br></p><blockquote>${_currentMail!.text}</blockquote>' 
          : '',
    ));
    appState.setIndexTab('sendmail');
  }

  void _forwardMail() {
    if (_currentMail == null) return;
    final appState = context.read<AppState>();
    final l = AppLocalizations(appState.locale);
    
    appState.setSendMailModel(SendMailModel(
      subject: '${l.get('forward')}: ${_currentMail!.subject}',
      contentType: _currentMail!.message != null ? 'html' : 'text',
      content: _currentMail!.message ?? _currentMail!.text ?? '',
    ));
    appState.setIndexTab('sendmail');
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final l = AppLocalizations(appState.locale);
    final isMobileView = isMobile(context);

    return isMobileView ? _buildMobileView(appState, l) : _buildDesktopView(appState, l);
  }

  Widget _buildDesktopView(AppState appState, AppLocalizations l) {
    return Column(
      children: [
        // 工具栏
        _buildToolbar(appState, l),
        const SizedBox(height: 16),
        // 邮件列表和预览
        SizedBox(
          height: 500,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 邮件列表
              SizedBox(
                width: 280,
                child: _buildMailList(l),
              ),
              const SizedBox(width: 16),
              // 邮件预览
              Expanded(
                child: _buildMailPreview(appState, l),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMobileView(AppState appState, AppLocalizations l) {
    return Column(
      children: [
        // 工具栏
        _buildMobileToolbar(appState, l),
        const SizedBox(height: 8),
        // 过滤输入
        if (widget.showFilterInput)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: l.get('keywordQueryTip'),
                border: const OutlineInputBorder(),
                isDense: true,
                suffixIcon: _filterKeyword.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _filterKeyword = ''),
                      )
                    : null,
              ),
              onChanged: (value) => setState(() => _filterKeyword = value),
            ),
          ),
        // 邮件列表
        SizedBox(
          height: 400,
          child: _buildMailList(l),
        ),
      ],
    );
  }

  Widget _buildToolbar(AppState appState, AppLocalizations l) {
    if (_multiActionMode) {
      return Row(
        children: [
          TextButton(
            onPressed: () => setState(() {
              _multiActionMode = false;
              for (var mail in _mails) {
                mail.checked = false;
              }
            }),
            child: Text(l.get('cancelMultiAction')),
          ),
          TextButton(
            onPressed: () {
              for (var mail in _mails) {
                mail.checked = true;
              }
              setState(() {});
            },
            child: Text(l.get('selectAll')),
          ),
          TextButton(
            onPressed: () {
              for (var mail in _mails) {
                mail.checked = false;
              }
              setState(() {});
            },
            child: Text(l.get('unselectAll')),
          ),
          if (widget.enableUserDeleteEmail)
            TextButton(
              onPressed: _deleteSelectedMails,
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: Text(l.get('delete')),
            ),
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.download),
            label: Text(l.get('download')),
          ),
        ],
      );
    }

    return Row(
      children: [
        TextButton(
          onPressed: () => setState(() => _multiActionMode = true),
          child: Text(l.get('multiAction')),
        ),
        // 分页
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              onPressed: _page > 1 ? () {
                setState(() => _page--);
                _loadMails();
              } : null,
            ),
            Text('$_page / ${(_count / _pageSize).ceil().clamp(1, 999)}'),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              onPressed: _page < (_count / _pageSize).ceil() ? () {
                setState(() => _page++);
                _loadMails();
              } : null,
            ),
          ],
        ),
        // 自动刷新
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Switch(
              value: appState.autoRefresh,
              onChanged: (value) {
                appState.setAutoRefresh(value);
                _setupAutoRefresh();
              },
            ),
            Text(appState.autoRefresh 
                ? l.getWithParam('refreshAfter', {'msg': '$_autoRefreshCountdown'})
                : l.get('autoRefresh')),
          ],
        ),
        TextButton(
          onPressed: () {
            _page = 1;
            _loadMails();
          },
          child: Text(l.get('refresh')),
        ),
        // 过滤输入
        if (widget.showFilterInput)
          SizedBox(
            width: 200,
            child: TextField(
              decoration: InputDecoration(
                hintText: l.get('keywordQueryTip'),
                border: const OutlineInputBorder(),
                isDense: true,
                suffixIcon: _filterKeyword.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _filterKeyword = ''),
                      )
                    : null,
              ),
              onChanged: (value) => setState(() => _filterKeyword = value),
            ),
          ),
      ],
    );
  }

  Widget _buildMobileToolbar(AppState appState, AppLocalizations l) {
    return Row(
      children: [
        // 分页
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.chevron_left),
              iconSize: 20,
              onPressed: _page > 1 ? () {
                setState(() => _page--);
                _loadMails();
              } : null,
            ),
            Text('$_page/${(_count / _pageSize).ceil().clamp(1, 999)}', style: const TextStyle(fontSize: 12)),
            IconButton(
              icon: const Icon(Icons.chevron_right),
              iconSize: 20,
              onPressed: _page < (_count / _pageSize).ceil() ? () {
                setState(() => _page++);
                _loadMails();
              } : null,
            ),
          ],
        ),
        // 自动刷新
        Switch(
          value: appState.autoRefresh,
          onChanged: (value) {
            appState.setAutoRefresh(value);
            _setupAutoRefresh();
          },
        ),
        Text(appState.autoRefresh ? '${_autoRefreshCountdown}s' : l.get('autoRefresh'), 
            style: const TextStyle(fontSize: 12)),
        TextButton(
          onPressed: () {
            _page = 1;
            _loadMails();
          },
          child: Text(l.get('refresh'), style: const TextStyle(fontSize: 12)),
        ),
      ],
    );
  }

  Widget _buildMailList(AppLocalizations l) {
    final mails = _filteredMails;
    
    if (_isLoading && mails.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (mails.isEmpty) {
      return Center(child: Text(l.get('noData')));
    }

    return ListView.builder(
      itemCount: mails.length,
      itemBuilder: (context, index) {
        final mail = mails[index];
        final isSelected = _currentMail?.id == mail.id;
        final appState = context.read<AppState>();

        return ListTile(
          selected: isSelected,
          selectedTileColor: Theme.of(context).colorScheme.primaryContainer.withOpacity(0.3),
          leading: _multiActionMode
              ? Checkbox(
                  value: mail.checked,
                  onChanged: (value) {
                    setState(() => mail.checked = value ?? false);
                  },
                )
              : null,
          title: Text(
            mail.subject,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ID: ${mail.id} | ${utcToLocalDate(mail.createdAt, appState.useUTCDate)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
              Text(
                mail.source,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
          onTap: () {
            if (_multiActionMode) {
              setState(() => mail.checked = !mail.checked);
            } else {
              setState(() => _currentMail = mail);
              if (isMobile(context)) {
                _showMailBottomSheet(mail);
              }
            }
          },
        );
      },
    );
  }

  Widget _buildMailPreview(AppState appState, AppLocalizations l) {
    if (_currentMail == null) {
      return Card(
        child: Center(
          child: Text(l.get('pleaseSelectMail')),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 上一封/下一封
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            TextButton.icon(
              onPressed: _canGoPrev ? _prevMail : null,
              icon: const Icon(Icons.chevron_left),
              label: Text(l.get('prevMail')),
            ),
            TextButton.icon(
              onPressed: _canGoNext ? _nextMail : null,
              icon: const Icon(Icons.chevron_right),
              label: Text(l.get('nextMail')),
            ),
          ],
        ),
        const SizedBox(height: 8),
        // 邮件标题
        Text(
          _currentMail!.subject,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const Divider(),
        // 邮件内容
        Expanded(
          child: SingleChildScrollView(
            child: MailContentRenderer(
              mail: _currentMail!,
              showEmailTo: widget.showEmailTo,
              enableUserDeleteEmail: widget.enableUserDeleteEmail,
              showReply: widget.showReply,
              showSaveS3: widget.showSaveS3,
              onDelete: _deleteMail,
              onReply: _replyMail,
              onForward: _forwardMail,
            ),
          ),
        ),
      ],
    );
  }

  bool get _canGoPrev {
    if (_currentMail == null) return false;
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    return index > 0 || _page > 1;
  }

  bool get _canGoNext {
    if (_currentMail == null) return false;
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    return index < _filteredMails.length - 1 || _count > _page * _pageSize;
  }

  void _prevMail() {
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    if (index > 0) {
      setState(() => _currentMail = _filteredMails[index - 1]);
    } else if (_page > 1) {
      _page--;
      _loadMails().then((_) {
        if (_filteredMails.isNotEmpty) {
          setState(() => _currentMail = _filteredMails.last);
        }
      });
    }
  }

  void _nextMail() {
    final index = _filteredMails.indexWhere((m) => m.id == _currentMail!.id);
    if (index < _filteredMails.length - 1) {
      setState(() => _currentMail = _filteredMails[index + 1]);
    } else if (_count > _page * _pageSize) {
      _page++;
      _loadMails().then((_) {
        if (_filteredMails.isNotEmpty) {
          setState(() => _currentMail = _filteredMails.first);
        }
      });
    }
  }

  void _showMailBottomSheet(Email mail) {
    final appState = context.read<AppState>();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            // 标题栏
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      mail.subject,
                      style: Theme.of(context).textTheme.titleMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // 邮件内容
            Expanded(
              child: SingleChildScrollView(
                controller: scrollController,
                padding: const EdgeInsets.all(16),
                child: MailContentRenderer(
                  mail: mail,
                  showEmailTo: widget.showEmailTo,
                  enableUserDeleteEmail: widget.enableUserDeleteEmail,
                  showReply: widget.showReply,
                  showSaveS3: widget.showSaveS3,
                  onDelete: () {
                    Navigator.pop(context);
                    _deleteMail();
                  },
                  onReply: () {
                    Navigator.pop(context);
                    _replyMail();
                  },
                  onForward: () {
                    Navigator.pop(context);
                    _forwardMail();
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteSelectedMails() async {
    final selectedMails = _mails.where((m) => m.checked).toList();
    if (selectedMails.isEmpty) {
      _showMessage('请选择邮件', isError: true);
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除'),
        content: Text('确定删除 ${selectedMails.length} 封邮件?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('删除'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    for (final mail in selectedMails) {
      try {
        await Api.instance.deleteMail(mail.id);
      } catch (e) {
        debugPrint('Delete mail ${mail.id} error: $e');
      }
    }
    _showMessage('删除成功');
    await _loadMails();
    setState(() => _multiActionMode = false);
  }
}
