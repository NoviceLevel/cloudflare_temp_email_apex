import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../store/index.dart';
import '../utils/index.dart';
import 'header.dart';
import 'footer.dart';
import 'user/user_bar.dart';
import 'user/address_management.dart';
import 'user/user_mail_box.dart';
import 'user/user_settings_page.dart';
import 'user/bind_address.dart';

class UserPage extends StatefulWidget {
  final String locale;
  const UserPage({super.key, this.locale = 'zh'});

  @override
  State<UserPage> createState() => _UserPageState();
}

class _UserPageState extends State<UserPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Map<String, String> get _t {
    final appState = context.watch<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'addressManagement': isZh ? '地址管理' : 'Address Management',
      'userMailBox': isZh ? '收件箱' : 'Mail Box',
      'userSettings': isZh ? '用户设置' : 'User Settings',
      'bindAddress': isZh ? '绑定邮箱地址' : 'Bind Mail Address',
    };
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final isMobileView = isMobile(context);
    final userEmail = appState.userSettings.userEmail;

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
                        const UserBarView(),
                        if (userEmail != null && userEmail.toString().isNotEmpty) ...[
                          const SizedBox(height: 16),
                          TabBar(
                            controller: _tabController,
                            isScrollable: true,
                            tabs: [
                              Tab(text: _t['addressManagement']),
                              Tab(text: _t['userMailBox']),
                              Tab(text: _t['userSettings']),
                              Tab(text: _t['bindAddress']),
                            ],
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: MediaQuery.of(context).size.height - 300,
                            child: TabBarView(
                              controller: _tabController,
                              children: const [
                                AddressManagementView(),
                                UserMailBoxView(),
                                UserSettingsPageView(),
                                BindAddressView(),
                              ],
                            ),
                          ),
                        ],
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
}
