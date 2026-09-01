import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api_exception.dart';
import '../l10n/l10n_x.dart';
import '../state/core_providers.dart';
import '../state/profile_provider.dart';
import '../widgets/telegram_link_waiting.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _codeSent = false;
  bool _loading = false;
  String? _error;
  String? _telegramLinkUrl;
  String? get _phone => ref.read(profileProvider).value?.phone;

  Future<void> _sendCode() async {
    final phone = _phone;
    if (phone == null) {
      setState(() => _error = context.l10n.phoneNotFoundError);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref.read(authRepositoryProvider).forgotPassword(phone);
      if (result.telegramLinkUrl != null) {
        setState(() => _telegramLinkUrl = result.telegramLinkUrl);
      } else {
        setState(() => _codeSent = true);
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reset() async {
    final phone = _phone;
    if (phone == null) {
      setState(() => _error = context.l10n.phoneNotFoundError);
      return;
    }
    if (_codeController.text.trim().length < 4 || _passwordController.text.length < 6) {
      setState(() => _error = context.l10n.resetPasswordFormError);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).resetPassword(
            phone: phone,
            code: _codeController.text.trim(),
            newPassword: _passwordController.text,
          );
      if (!mounted) return;
      context.pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.passwordUpdatedSuccess)),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.changePasswordMenu)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(context.l10n.codeWillBeSentTo(_phone ?? ''),
                  style: TextStyle(color: cs.onSurfaceVariant)),
              if (_telegramLinkUrl != null) ...[
                const SizedBox(height: 20),
                TelegramLinkWaiting(
                  phone: _phone ?? '',
                  linkUrl: _telegramLinkUrl!,
                  onLinked: () => setState(() {
                    _telegramLinkUrl = null;
                    _codeSent = true;
                  }),
                ),
              ],
              if (_codeSent) ...[
                const SizedBox(height: 16),
                TextField(
                  controller: _codeController,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  decoration: InputDecoration(labelText: context.l10n.otpCodeFieldLabel),
                ),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(labelText: context.l10n.newPasswordFieldLabel),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: cs.error)),
              ],
              if (_telegramLinkUrl == null) ...[
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _loading ? null : (_codeSent ? _reset : _sendCode),
                  child: _loading
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_codeSent ? context.l10n.updatePasswordAction : context.l10n.sendCodeAction),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
