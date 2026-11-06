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
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final screenHeight = MediaQuery.sizeOf(context).height;
    final maxSheetHeight = _targetRole == UserRole.worker
        ? screenHeight * 0.52
        : 320.0;

    return SafeArea(
      top: false,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: maxSheetHeight),
        child: Padding(
          padding: EdgeInsets.fromLTRB(
            20,
            10,
            20,
            bottomInset > 0 ? bottomInset + 10 : 14,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: cs.outlineVariant.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                children: [
                  Icon(
                    PhosphorIcons.arrowsClockwise(PhosphorIconsStyle.bold),
                    color: cs.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      context.l10n.switchToRoleTitle(_targetRole.label(context)),
                      style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                context.l10n.switchRoleDescription(widget.currentRole.label(context)),
                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13, height: 1.3),
              ),
              if (_targetRole == UserRole.worker)
                Flexible(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(height: 12),
                        Text(
                          context.l10n.professionsOptionalLabel,
                          style: TextStyle(fontWeight: FontWeight.w700, color: cs.onSurface),
                        ),
                        const SizedBox(height: 8),
                        ProfessionMultiSelector(
                          selectedIds: _professionIds,
                          onChanged: (ids) => setState(() => _professionIds = ids),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: cs.error, fontSize: 12.5)),
              ],
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: OutlinedButton(
                        onPressed: _switching ? null : () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          context.l10n.commonCancel,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: SizedBox(
                      height: 44,
                      child: ElevatedButton(
                        onPressed: _switching ? null : _confirm,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: _switching
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Text(
                                context.l10n.switchAction,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
