import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../store/index.dart';
import '../../api/index.dart';
import '../../utils/index.dart';

class AddressManagementView extends StatefulWidget {
  const AddressManagementView({super.key});

  @override
  State<AddressManagementView> createState() => _AddressManagementViewState();
}

class _AddressManagementViewState extends State<AddressManagementView> {
  List<UserAddress> _addresses = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    final appState = context.read<AppState>();
    if (appState.userJwt.isEmpty) return;
    
    setState(() => _isLoading = true);
    try {
      final addresses = await Api.instance.getUserAddresses();
      setState(() => _addresses = addresses);
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

  Future<void> _switchAddress(UserAddress address) async {
    final appState = context.read<AppState>();
    try {
      // 获取地址的 JWT
      final jwt = await Api.instance.fetch('/user_api/addresses/${address.id}/jwt');
      await appState.setJwt(jwt['jwt']);
      final settings = await Api.instance.getSettings();
      appState.setSettings(settings);
      _showMessage('切换成功');
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  Future<void> _deleteAddress(UserAddress address) async {
    final appState = context.read<AppState>();
    
    try {
      await Api.instance.deleteUserAddress(address.id);
      _showMessage(appState.locale == 'zh' ? '删除成功' : 'Deleted successfully');
      await _loadAddresses();
    } catch (e) {
      _showMessage(e.toString(), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    if (appState.userJwt.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.login,
              size: 48,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              appState.locale == 'zh' ? '请先登录用户账户' : 'Please login first',
              style: TextStyle(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // 刷新按钮
        Align(
          alignment: Alignment.centerRight,
          child: IconButton(
            onPressed: _loadAddresses,
            icon: const Icon(Icons.refresh),
          ),
        ),
        // 地址列表
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _addresses.isEmpty
                  ? Center(
                      child: Text(
                        appState.locale == 'zh' ? '暂无绑定地址' : 'No addresses bound',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                      ),
                    )
                  : ListView.builder(
                      itemCount: _addresses.length,
                      itemBuilder: (context, index) {
                        final address = _addresses[index];
                        final isCurrent = address.address == appState.settings.address;
                        
                        return ListTile(
                          leading: Icon(
                            isCurrent ? Icons.email : Icons.email_outlined,
                            color: isCurrent ? Theme.of(context).colorScheme.primary : null,
                          ),
                          title: Text(address.address),
                          subtitle: Text(utcToLocalDate(address.createdAt, appState.useUTCDate)),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (isCurrent)
                                const Chip(label: Text('当前'))
                              else
                                TextButton(
                                  onPressed: () => _switchAddress(address),
                                  child: Text(appState.locale == 'zh' ? '切换' : 'Switch'),
                                ),
                              IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _showDeleteConfirm(address),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  void _showDeleteConfirm(UserAddress address) {
    final appState = context.read<AppState>();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(appState.locale == 'zh' ? '删除地址' : 'Delete Address'),
        content: Text(
          appState.locale == 'zh' 
              ? '确定要删除地址 ${address.address} 吗？'
              : 'Are you sure to delete ${address.address}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(appState.locale == 'zh' ? '取消' : 'Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteAddress(address);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(appState.locale == 'zh' ? '删除' : 'Delete'),
          ),
        ],
      ),
    );
  }
}
