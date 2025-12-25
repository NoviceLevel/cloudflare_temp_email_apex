import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';

class UserLoginView extends StatefulWidget {
  const UserLoginView({super.key});

  @override
  State<UserLoginView> createState() => _UserLoginViewState();
}

class _UserLoginViewState extends State<UserLoginView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _loading = false;
  bool _showForgotPasswordDialog = false;
  int _verifyCodeTimeout = 0;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Map<String, String> get _t {
    final appState = context.read<AppState>();
    final isZh = appState.locale == 'zh';
    return {
      'login': isZh ? '登录' : 'Login',
      'register': isZh ? '注册' : 'Register',
      'email': isZh ? '邮箱' : 'Email',
      'password': isZh ? '密码' : 'Password',
      'verifyCode': isZh ? '验证码' : 'Verification Code',
      'sendVerificationCode': isZh ? '发送验证码' : 'Send Verification Code',
      'verifyCodeSent': isZh ? '验证码已发送' : 'Verification Code Sent',
      'waitForVerifyCode': isZh ? '等待' : 'Wait',
      'forgotPassword': isZh ? '忘记密码' : 'Forgot Password',
      'cannotForgotPassword': isZh 
          ? '未开启邮箱验证或未开启注册功能，无法重置密码，请联系管理员' 
          : 'Mail verification is disabled, cannot reset password',
      'resetPassword': isZh ? '重置密码' : 'Reset Password',
      'pleaseInput': isZh ? '请输入邮箱和密码' : 'Please input email and password',
      'pleaseInputEmail': isZh ? '请输入邮箱' : 'Please input email',
      'pleaseInputCode': isZh ? '请输入验证码' : 'Please input code',
      'pleaseLogin': isZh ? '请登录' : 'Please login',
      'loginWithPasskey': isZh ? '使用 Passkey 登录' : 'Login with Passkey',
      'loginWith': isZh ? '使用 {provider} 登录' : 'Login with {provider}',
      'cancel': isZh ? '取消' : 'Cancel',
    };
  }

  void _showMessage(String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? Colors.red : Colors.green),
    );
  }

  Future<void> _emailLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showMessage(_t['pleaseInput']!, isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await Api.instance.fetch('/user_api/login', method: 'POST', body: {
        'email': _emailController.text,
        'password': _passwordController.text,
      });
      if (res != null && res['jwt'] != null) {
        final appState = context.read<AppState>();
        appState.setUserJwt(res['jwt']);
        // Reload page
        _showMessage(_t['pleaseLogin']!);
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _sendVerificationCode() async {
    if (_emailController.text.isEmpty) {
      _showMessage(_t['pleaseInputEmail']!, isError: true);
      return;
    }
    try {
      final res = await Api.instance.fetch('/user_api/verify_code', method: 'POST', body: {
        'email': _emailController.text,
      });
      if (res != null && res['expirationTtl'] != null) {
        _showMessage(_t['verifyCodeSent']!);
        setState(() => _verifyCodeTimeout = res['expirationTtl']);
        _startCountdown();
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  void _startCountdown() {
    Future.delayed(const Duration(seconds: 1), () {
      if (_verifyCodeTimeout > 0 && mounted) {
        setState(() => _verifyCodeTimeout--);
        _startCountdown();
      }
    });
  }

  Future<void> _emailSignup() async {
    final appState = context.read<AppState>();
    final userOpenSettings = appState.userOpenSettings;
    
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showMessage(_t['pleaseInput']!, isError: true);
      return;
    }
    if (_codeController.text.isEmpty && userOpenSettings.enableMailVerify) {
      _showMessage(_t['pleaseInputCode']!, isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await Api.instance.fetch('/user_api/register', method: 'POST', body: {
        'email': _emailController.text,
        'password': _passwordController.text,
        'code': _codeController.text,
      });
      _tabController.animateTo(0);
      _showMessage(_t['pleaseLogin']!);
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _oauth2Login(String clientID) async {
    final appState = context.read<AppState>();
    try {
      final state = DateTime.now().millisecondsSinceEpoch.toString();
      appState.setUserOauth2Session(clientID, state);
      final res = await Api.instance.fetch('/user_api/oauth2/login_url?clientID=$clientID&state=$state');
      if (res != null && res['url'] != null) {
        // In Flutter Web, we'd use url_launcher or window.location
        _showMessage('Redirect to: ${res['url']}');
      }
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final userOpenSettings = appState.userOpenSettings;
    final enableRegister = userOpenSettings.enable;
    final enableMailVerify = userOpenSettings.enableMailVerify;
    final oauth2ClientIDs = userOpenSettings.oauth2ClientIDs;

    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: _t['login']),
            if (enableRegister) Tab(text: _t['register']),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 400,
          child: TabBarView(
            controller: _tabController,
            children: [
              // Login Tab
              SingleChildScrollView(
                child: Column(
                  children: [
                    TextField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        labelText: _t['email'],
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: _t['password'],
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _loading ? null : _emailLogin,
                        child: _loading
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : Text(_t['login']!),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => setState(() => _showForgotPasswordDialog = true),
                      child: Text(_t['forgotPassword']!),
                    ),
                    const Divider(),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () => _showMessage('Passkey not supported in this demo'),
                        icon: const Icon(Icons.key),
                        label: Text(_t['loginWithPasskey']!),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...oauth2ClientIDs.map((item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () => _oauth2Login(item.clientID),
                          icon: Icon(item.name.toLowerCase() == 'github' ? Icons.code : Icons.login),
                          label: Text(_t['loginWith']!.replaceAll('{provider}', item.name)),
                        ),
                      ),
                    )),
                  ],
                ),
              ),
              // Register Tab
              if (enableRegister)
                SingleChildScrollView(
                  child: Column(
                    children: [
                      TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          labelText: _t['email'],
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: _t['password'],
                          border: const OutlineInputBorder(),
                        ),
                      ),
                      if (enableMailVerify) ...[
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _codeController,
                                decoration: InputDecoration(
                                  labelText: _t['verifyCode'],
                                  border: const OutlineInputBorder(),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            OutlinedButton(
                              onPressed: _verifyCodeTimeout > 0 ? null : _sendVerificationCode,
                              child: Text(_verifyCodeTimeout > 0 
                                  ? '${_t['waitForVerifyCode']} $_verifyCodeTimeout s' 
                                  : _t['sendVerificationCode']!),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: _loading ? null : _emailSignup,
                          child: _loading
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                              : Text(_t['register']!),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
        if (_showForgotPasswordDialog) _buildForgotPasswordDialog(enableRegister, enableMailVerify),
      ],
    );
  }

  Widget _buildForgotPasswordDialog(bool enableRegister, bool enableMailVerify) {
    return AlertDialog(
      title: Text(_t['forgotPassword']!),
      content: enableRegister && enableMailVerify
          ? Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(labelText: _t['email'], border: const OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(labelText: _t['password'], border: const OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _codeController,
                        decoration: InputDecoration(labelText: _t['verifyCode'], border: const OutlineInputBorder()),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: _verifyCodeTimeout > 0 ? null : _sendVerificationCode,
                      child: Text(_verifyCodeTimeout > 0 ? '$_verifyCodeTimeout s' : _t['sendVerificationCode']!),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _emailSignup,
                    child: Text(_t['resetPassword']!),
                  ),
                ),
              ],
            )
          : Card(
              color: Colors.orange.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(_t['cannotForgotPassword']!),
              ),
            ),
      actions: [
        TextButton(
          onPressed: () => setState(() => _showForgotPasswordDialog = false),
          child: Text(_t['cancel']!),
        ),
      ],
    );
  }
}
