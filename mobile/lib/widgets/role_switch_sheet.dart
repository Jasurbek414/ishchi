import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../core/api_exception.dart';
import '../l10n/l10n_x.dart';
import '../models/enums.dart';
import '../state/auth_provider.dart';
import '../widgets/profession_multi_selector.dart';

/// Bottom sheet for toggling the account between WORKER and EMPLOYER. Both profiles
/// persist independently, so switching back later restores whatever was there before.
class RoleSwitchSheet extends ConsumerStatefulWidget {
  const RoleSwitchSheet({super.key, required this.currentRole});

  final UserRole currentRole;

  @override
  ConsumerState<RoleSwitchSheet> createState() => _RoleSwitchSheetState();
}

class _RoleSwitchSheetState extends ConsumerState<RoleSwitchSheet> {
  Set<int> _professionIds = {};
  bool _switching = false;
  String? _error;

  UserRole get _targetRole => widget.currentRole == UserRole.worker ? UserRole.employer : UserRole.worker;

  Future<void> _confirm() async {
    setState(() {
      _switching = true;
      _error = null;
    });
    try {
      await ref.read(authNotifierProvider.notifier).switchRole(
            professionIds: _targetRole == UserRole.worker ? _professionIds.toList() : null,
          );
      if (mounted) Navigator.pop(context);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _switching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(PhosphorIcons.arrowsClockwise(PhosphorIconsStyle.fill), color: cs.primary, size: 24),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    context.l10n.switchToRoleTitle(_targetRole.label(context)),
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              context.l10n.switchRoleDescription(widget.currentRole.label(context)),
              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13.5, height: 1.4),
            ),
            if (_targetRole == UserRole.worker) ...[
              const SizedBox(height: 18),
              Text(context.l10n.professionsOptionalLabel, style: TextStyle(fontWeight: FontWeight.w700, color: cs.onSurface)),
              const SizedBox(height: 8),
              ProfessionMultiSelector(
                selectedIds: _professionIds,
                onChanged: (ids) => setState(() => _professionIds = ids),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: cs.error)),
            ],
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _switching ? null : () => Navigator.pop(context),
                    child: Text(context.l10n.commonCancel),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _switching ? null : _confirm,
                    child: _switching
                        ? const SizedBox(
                            height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(context.l10n.switchAction),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
