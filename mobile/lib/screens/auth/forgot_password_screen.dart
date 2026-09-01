import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_exception.dart';
import '../../l10n/l10n_x.dart';
import '../../state/core_providers.dart';
import '../../widgets/telegram_link_waiting.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _phoneController = TextEditingController(text: '+998');
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _codeSent = false;
  bool _loading = false;
  String? _error;
  String? _telegramLinkUrl;

  Future<void> _sendCode() async {
    if (!RegExp(r'^\+998\d{9}$').hasMatch(_phoneController.text.trim())) {
      setState(() => _error = context.l10n.phoneFormatError);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref.read(authRepositoryProvider).forgotPassword(_phoneController.text.trim());
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
            phone: _phoneController.text.trim(),
            code: _codeController.text.trim(),
            newPassword: _passwordController.text,
          );
      if (!mounted) return;
      context.go('/login');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.passwordResetSuccess)),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.resetPasswordTitle)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _phoneController,
                enabled: !_codeSent && _telegramLinkUrl == null,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(labelText: context.l10n.phoneFieldLabel),
              ),
              if (_telegramLinkUrl != null) ...[
                const SizedBox(height: 20),
                TelegramLinkWaiting(
                  phone: _phoneController.text.trim(),
                  linkUrl: _telegramLinkUrl!,
                  onLinked: () => setState(() {
                    _telegramLinkUrl = null;
                    _codeSent = true;
                  }),
                ),
              ],
              if (_codeSent) ...[
                const SizedBox(height: 14),
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
