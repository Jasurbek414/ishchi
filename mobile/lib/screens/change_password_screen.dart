import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/api_exception.dart';
import '../l10n/l10n_x.dart';
import '../state/core_providers.dart';
import '../widgets/password_field.dart';

/// Changing a password from inside the app now proves knowledge of the current one.
///
/// It used to drive the public forgot-password flow instead: request a code, type the code, set a
/// new password. That meant anyone holding an unlocked phone with the linked Telegram on it could
/// take the account over without ever knowing the password.
class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();

  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    if (currentPassword.isEmpty || newPassword.length < 6) {
      setState(() => _error = context.l10n.changePasswordFormError);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).changePassword(
            currentPassword: currentPassword,
            newPassword: newPassword,
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
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.changePasswordMenu)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(context.l10n.changePasswordHint, style: TextStyle(color: cs.onSurfaceVariant)),
              const SizedBox(height: 16),
              PasswordField(
                controller: _currentPasswordController,
                autofillHints: const [AutofillHints.password],
                labelText: context.l10n.currentPasswordFieldLabel,
              ),
              const SizedBox(height: 8),
              PasswordField(
                controller: _newPasswordController,
                autofillHints: const [AutofillHints.newPassword],
                labelText: context.l10n.newPasswordFieldLabel,
                onFieldSubmitted: (_) => _loading ? null : _submit(),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: cs.error)),
              ],
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(context.l10n.updatePasswordAction),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
