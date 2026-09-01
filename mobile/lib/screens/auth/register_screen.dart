import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/api_exception.dart';
import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../state/core_providers.dart';
import '../../widgets/region_district_selector.dart';
import '../../widgets/telegram_link_waiting.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController(text: '+998');
  final _passwordController = TextEditingController();

  UserRole _role = UserRole.worker;
  int? _regionId;
  int? _districtId;
  bool _loading = false;
  String? _error;
  String? _telegramLinkUrl;

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_regionId == null || _districtId == null) {
      setState(() => _error = context.l10n.selectRegionDistrictError);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref.read(authRepositoryProvider).register(
            phone: _phoneController.text.trim(),
            password: _passwordController.text,
            firstName: _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim(),
            role: _role,
            regionId: _regionId!,
            districtId: _districtId!,
          );
      if (!mounted) return;
      if (result.telegramLinkUrl != null) {
        setState(() => _telegramLinkUrl = result.telegramLinkUrl);
      } else {
        context.push('/otp?phone=${Uri.encodeComponent(_phoneController.text.trim())}');
      }
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
      appBar: AppBar(title: Text(context.l10n.registerTitle)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: _telegramLinkUrl != null
              ? TelegramLinkWaiting(
                  phone: _phoneController.text.trim(),
                  linkUrl: _telegramLinkUrl!,
                  onLinked: () => context.go('/otp?phone=${Uri.encodeComponent(_phoneController.text.trim())}'),
                )
              : Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.l10n.registerAsQuestion, style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 10),
                SegmentedButton<UserRole>(
                  segments: [
                    ButtonSegment(value: UserRole.worker, label: Text(context.l10n.roleWorker), icon: const Icon(Icons.engineering_outlined)),
                    ButtonSegment(value: UserRole.employer, label: Text(context.l10n.roleEmployer), icon: const Icon(Icons.business_center_outlined)),
                  ],
                  selected: {_role},
                  onSelectionChanged: (value) => setState(() => _role = value.first),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _firstNameController,
                        decoration: InputDecoration(labelText: context.l10n.firstNameFieldLabel),
                        validator: (v) => (v == null || v.trim().isEmpty) ? context.l10n.requiredFieldError : null,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _lastNameController,
                        decoration: InputDecoration(labelText: context.l10n.lastNameFieldLabel),
                        validator: (v) => (v == null || v.trim().isEmpty) ? context.l10n.requiredFieldError : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
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
                const SizedBox(height: 20),
                RegionDistrictSelector(
                  regionId: _regionId,
                  districtId: _districtId,
                  onChanged: (region, district) => setState(() {
                    _regionId = region;
                    _districtId = district;
                  }),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 10),
                  Text(_error!, style: TextStyle(color: cs.error)),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 22, width: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(context.l10n.registerTitle),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
