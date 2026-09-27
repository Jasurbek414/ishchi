import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_exception.dart';
import '../../core/theme.dart';
import '../../l10n/l10n_x.dart';
import '../../state/core_providers.dart';
import '../../widgets/telegram_link_waiting.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key, required this.phone});

  final String phone;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _codeController = TextEditingController();
  bool _loading = false;
  bool _resending = false;
  String? _error;
  String? _info;
  String? _telegramLinkUrl;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _verify() async {
    if (_codeController.text.trim().length < 4) {
      setState(() => _error = context.l10n.enterFullCodeError);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).verifyOtp(phone: widget.phone, code: _codeController.text.trim());
      if (!mounted) return;
      context.go('/login');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.l10n.phoneVerifiedSuccess)),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    setState(() {
      _resending = true;
      _error = null;
      _info = null;
    });
    try {
      final result = await ref.read(authRepositoryProvider).resendOtp(widget.phone);
      if (result.telegramLinkUrl != null) {
        setState(() => _telegramLinkUrl = result.telegramLinkUrl);
      } else {
        setState(() => _info = context.l10n.codeResentInfo);
      }
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.verificationTitle)),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _telegramLinkUrl != null
              ? TelegramLinkWaiting(
                  phone: widget.phone,
                  linkUrl: _telegramLinkUrl!,
                  onLinked: () => setState(() {
                    _telegramLinkUrl = null;
                    _info = context.l10n.codeSentInfo;
                  }),
                )
              : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(context.l10n.enterCodeSentTo(widget.phone),
                  style: TextStyle(fontSize: 16, color: cs.onSurfaceVariant)),
              const SizedBox(height: 24),
              TextField(
                controller: _codeController,
                keyboardType: TextInputType.number,
                maxLength: 4,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 28, letterSpacing: 12, fontWeight: FontWeight.w700),
                decoration: const InputDecoration(counterText: '', hintText: '••••'),
              ),
              if (_error != null) Text(_error!, style: TextStyle(color: cs.error)),
              if (_info != null) Text(_info!, style: TextStyle(color: context.themeSuccess)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loading ? null : _verify,
                child: _loading
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(context.l10n.verifyAction),
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: _resending ? null : _resend,
                  child: Text(_resending ? context.l10n.sendingInProgress : context.l10n.resendCodeAction),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
