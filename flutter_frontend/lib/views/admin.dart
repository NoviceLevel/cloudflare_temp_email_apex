import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../store/index.dart';
import '../utils/index.dart';
import 'header.dart';
import 'footer.dart';
// Quick Setup
import 'admin/database_manager.dart';
import 'admin/account_settings.dart';
import 'admin/user_settings.dart';
import 'admin/worker_config.dart';
// Account
import 'admin/account.dart';
import 'admin/create_account.dart';
import 'admin/sender_access.dart';
import 'admin/ip_blacklist_settings.dart';
import 'admin/ai_extract_settings.dart';
import 'admin/webhook.dart';
// User
import 'admin/user_management.dart';
import 'admin/user_oauth2_settings.dart';
import 'admin/role_address_config.dart';
// Mails
import 'admin/mails.dart';
import 'admin/mails_unknow.dart';
import 'admin/send_box.dart';
import 'admin/send_mail.dart';
import 'admin/mail_webhook.dart';
// Others
import 'admin/telegram.dart';
import 'admin/statistics.dart';
import 'admin/maintenance.dart';
import 'common/appearance.dart';
import 'common/about.dart';

class AdminPage extends StatefulWidget {
  final String locale;
  const AdminPage({super.key, this.locale = 'zh'});

  @override
  State<AdminPage> createState() => _AdminPageState();
}

class _AdminPageState extends State<AdminPage> with TickerProviderStateMixin {
  late TabController _mainTabController;
  late TabController _quickSetupTabController;
  late TabController _accountTabController;
  late TabController _userTabController;
  late TabController _mailsTabController;
  late TabController _maintenanceTabController;

  final _passwordController = TextEditingController();
  bool _showPasswordDialog = false;
  bool _showPassword = false;

  @override
  void initState() {
    super.initState();
    _mainTabController = TabController(length: 9, vsync: this);
    _quickSetupTabController = TabController(length: 4, vsync: this);
    _accountTabController = TabController(length: 7, vsync: this);
    _userTabController = TabController(length: 4, vsync: this);
    _mailsTabController = TabController(length: 5, vsync: this);
    _maintenanceTabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkAdminAuth());
  }

  @override
  void dispose() {
    _mainTabController.dispose();
    _quickSetupTabController.dispose();
    _accountTabController.dispose();
    _userTabController.dispose();
    _mailsTabController.dispose();
    _maintenanceTabController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _checkAdminAuth() {
    final appState = context.read<AppState>();
    if (!appState.showAdminPage) {
      setState(() => _showPasswordDialog = true);
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

  Future<void> _submitPassword() async {
    final appState = context.read<AppState>();
    await appState.setAdminAuth(_passwordController.text);
    setState(() => _showPasswordDialog = false);
  }

  Map<String, String> get _t {
    final appState = context.watch<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'adminPassword': isZh ? '管理员密码' : 'Admin Password',
      'accessTip': isZh ? '请输入 Admin 密码' : 'Please enter the admin password',
      'ok': isZh ? '确定' : 'OK',
      'quickSetup': isZh ? '快速设置' : 'Quick Setup',
      'account': isZh ? '账号' : 'Account',
      'user': isZh ? '用户' : 'User',
      'mails': isZh ? '邮件' : 'Mails',
      'telegram': isZh ? '电报机器人' : 'Telegram Bot',
      'statistics': isZh ? '统计' : 'Statistics',
      'maintenance': isZh ? '维护' : 'Maintenance',
      'appearance': isZh ? '外观' : 'Appearance',
      'about': isZh ? '关于' : 'About',
      // Quick Setup sub tabs
      'database': isZh ? '数据库' : 'Database',
      'accountSettings': isZh ? '账号设置' : 'Account Settings',
      'userSettings': isZh ? '用户设置' : 'User Settings',
      'workerConfig': isZh ? 'Worker 配置' : 'Worker Config',
      // Account sub tabs
      'accountCreate': isZh ? '创建账号' : 'Create Account',
      'senderAccess': isZh ? '发件权限控制' : 'Sender Access',
      'ipBlacklist': isZh ? 'IP 黑名单' : 'IP Blacklist',
      'aiExtract': isZh ? 'AI 提取设置' : 'AI Extract Settings',
      'webhook': isZh ? 'Webhook 设置' : 'Webhook Settings',
      // User sub tabs
      'userManagement': isZh ? '用户管理' : 'User Management',
      'oauth2Settings': isZh ? 'Oauth2 设置' : 'Oauth2 Settings',
      'roleAddressConfig': isZh ? '角色地址配置' : 'Role Address Config',
      // Mails sub tabs
      'unknow': isZh ? '无收件人邮件' : 'Unknown Mails',
      'sendBox': isZh ? '发件箱' : 'Send Box',
      'sendMail': isZh ? '发送邮件' : 'Send Mail',
      'mailWebhook': isZh ? '邮件 Webhook' : 'Mail Webhook',
    };
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isMobileView = isMobile(context);

    // 显示密码输入对话框
    if (_showPasswordDialog && !appState.showAdminPage) {
      return Scaffold(
        body: Column(
          children: [
            const HeaderView(),
            Expanded(
              child: Center(
                child: Card(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 400),
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_t['adminPassword']!, style: Theme.of(context).textTheme.titleLarge),
                        const SizedBox(height: 8),
                        Text(_t['accessTip']!, style: Theme.of(context).textTheme.bodyMedium),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _passwordController,
                          obscureText: !_showPassword,
                          decoration: InputDecoration(
                            border: const OutlineInputBorder(),
                            suffixIcon: IconButton(
                              icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
                              onPressed: () => setState(() => _showPassword = !_showPassword),
                            ),
                          ),
                          onSubmitted: (_) => _submitPassword(),
                        ),
                        const SizedBox(height: 16),
                        FilledButton(onPressed: _submitPassword, child: Text(_t['ok']!)),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const FooterView(),
          ],
        ),
      );
    }

    return Scaffold(
      body: Column(
        children: [
          const HeaderView(),
          Expanded(
            child: SingleChildScrollView(
              child: Center(
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    maxWidth: appState.useSideMargin && !isMobileView ? 1200 : double.infinity,
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(isMobileView ? 8 : 16),
                    child: Column(
                      children: [
                        // Main Tabs
                        TabBar(
                          controller: _mainTabController,
                          isScrollable: true,
                          tabs: [
                            Tab(text: _t['quickSetup']),
                            Tab(text: _t['account']),
                            Tab(text: _t['user']),
                            Tab(text: _t['mails']),
                            Tab(text: _t['telegram']),
                            Tab(text: _t['statistics']),
                            Tab(text: _t['maintenance']),
                            Tab(text: _t['appearance']),
                            Tab(text: _t['about']),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: MediaQuery.of(context).size.height - 200,
                          child: TabBarView(
                            controller: _mainTabController,
                            children: [
                              _buildQuickSetupTab(),
                              _buildAccountTab(),
                              _buildUserTab(),
                              _buildMailsTab(),
                              const AdminTelegramView(),
                              const AdminStatisticsView(),
                              _buildMaintenanceTab(),
                              const AppearanceView(),
                              const AboutView(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          const FooterView(),
        ],
      ),
    );
  }

  Widget _buildQuickSetupTab() {
    return Column(
      children: [
        TabBar(
          controller: _quickSetupTabController,
          isScrollable: true,
          tabs: [
            Tab(text: _t['database']),
            Tab(text: _t['accountSettings']),
            Tab(text: _t['userSettings']),
            Tab(text: _t['workerConfig']),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _quickSetupTabController,
            children: const [
              DatabaseManagerView(),
              AccountSettingsView(),
              UserSettingsView(),
              WorkerConfigView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAccountTab() {
    return Column(
      children: [
        TabBar(
          controller: _accountTabController,
          isScrollable: true,
          tabs: [
            Tab(text: _t['account']),
            Tab(text: _t['accountCreate']),
            Tab(text: _t['accountSettings']),
            Tab(text: _t['senderAccess']),
            Tab(text: _t['ipBlacklist']),
            Tab(text: _t['aiExtract']),
            Tab(text: _t['webhook']),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _accountTabController,
            children: const [
              AdminAccountView(),
              CreateAccountView(),
              AccountSettingsView(),
              SenderAccessView(),
              IpBlacklistSettingsView(),
              AiExtractSettingsView(),
              WebhookSettingsView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildUserTab() {
    return Column(
      children: [
        TabBar(
          controller: _userTabController,
          isScrollable: true,
          tabs: [
            Tab(text: _t['userManagement']),
            Tab(text: _t['userSettings']),
            Tab(text: _t['oauth2Settings']),
            Tab(text: _t['roleAddressConfig']),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _userTabController,
            children: const [
              UserManagementView(),
              UserSettingsView(),
              UserOauth2SettingsView(),
              RoleAddressConfigView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMailsTab() {
    return Column(
      children: [
        TabBar(
          controller: _mailsTabController,
          isScrollable: true,
          tabs: [
            Tab(text: _t['mails']),
            Tab(text: _t['unknow']),
            Tab(text: _t['sendBox']),
            Tab(text: _t['sendMail']),
            Tab(text: _t['mailWebhook']),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _mailsTabController,
            children: const [
              AdminMailsView(),
              MailsUnknowView(),
              AdminSendBoxView(),
              SendMailView(),
              MailWebhookView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMaintenanceTab() {
    return Column(
      children: [
        TabBar(
          controller: _maintenanceTabController,
          isScrollable: true,
          tabs: [
            Tab(text: _t['database']),
            Tab(text: _t['workerConfig']),
            Tab(text: _t['maintenance']),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _maintenanceTabController,
            children: const [
              DatabaseManagerView(),
              WorkerConfigView(),
              MaintenanceView(),
            ],
          ),
        ),
      ],
    );
  }
}
