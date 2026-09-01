import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_exception.dart';
import '../../l10n/l10n_x.dart';
import '../../state/app_settings_provider.dart';
import '../../state/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController(text: '+998');
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authNotifierProvider.notifier).login(
            phone: _phoneController.text.trim(),
            password: _passwordController.text,
          );
    } on ApiException catch (e) {
      if (mounted) _handleLoginError(e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // Login failures fall into distinct types that each need a different response:
  // a wrong password just needs an inline hint, but an unverified or blocked account
  // needs the user to actually go do something (verify the code, contact support) —
  // burying that in a small red line under the password field gets missed.
  void _handleLoginError(ApiException e) {
    switch (e.errorCode) {
      case 'ACCOUNT_NOT_VERIFIED':
        _showActionDialog(
          title: context.l10n.accountNotVerifiedTitle,
          message: e.message,
          actionLabel: context.l10n.getVerificationCodeAction,
          onAction: () => context.push('/otp?phone=${Uri.encodeComponent(_phoneController.text.trim())}'),
        );
        break;
      case 'ACCOUNT_BLOCKED':
        _showBlockedDialog(e.message);
        break;
      case 'NETWORK_ERROR':
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message),
            action: SnackBarAction(label: context.l10n.retryAction, onPressed: _submit),
          ),
        );
        break;
      case 'UNKNOWN_ERROR':
        _showActionDialog(title: context.l10n.genericErrorTitle, message: e.message);
        break;
      default:
        // INVALID_CREDENTIALS and validation errors: a simple inline message is enough,
        // the user just needs to check what they typed.
        setState(() => _error = e.message);
    }
  }

  void _showActionDialog({required String title, required String message, String? actionLabel, VoidCallback? onAction}) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: Text(context.l10n.commonClose)),
          if (actionLabel != null && onAction != null)
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                onAction();
              },
              child: Text(actionLabel),
            ),
        ],
      ),
    );
  }

  void _showBlockedDialog(String message) {
    final settings = ref.read(appSettingsProvider).valueOrNull;
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(context.l10n.accountBlockedTitle),
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: Text(context.l10n.commonClose)),
          if (settings?.supportPhone?.isNotEmpty == true)
            FilledButton(
              onPressed: () {
                Navigator.pop(dialogContext);
                launchUrl(Uri.parse('tel:${settings!.supportPhone}'));
              },
              child: Text(context.l10n.callSupportAction),
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    // Pre-warm support contact info so it's already loaded if the blocked-account
    // dialog needs to show a "call support" button.
    ref.watch(appSettingsProvider);
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                Text(context.l10n.welcomeTitle, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(context.l10n.loginSubtitle,
                    style: TextStyle(color: cs.onSurfaceVariant)),
                const SizedBox(height: 28),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(labelText: context.l10n.phoneFieldLabel, hintText: '+998901234567'),
                  validator: (v) => v != null && RegExp(r'^\+998\d{9}$').hasMatch(v)
                      ? null
                      : context.l10n.phoneFormatError,
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(labelText: context.l10n.passwordFieldLabel),
                  validator: (v) => (v == null || v.length < 6) ? context.l10n.passwordMinLengthError : null,
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/forgot-password'),
                    child: Text(context.l10n.forgotPasswordAction),
                  ),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 4),
                  Text(_error!, style: TextStyle(color: cs.error)),
                ],
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 22, width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(context.l10n.loginAction),
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: () => context.push('/register'),
                    child: Text(context.l10n.noAccountRegisterAction),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
