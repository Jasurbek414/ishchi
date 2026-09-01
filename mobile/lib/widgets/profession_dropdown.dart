import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/l10n_x.dart';
import '../state/profession_providers.dart';
import 'async_view.dart';

class ProfessionDropdown extends ConsumerWidget {
  const ProfessionDropdown({
    super.key,
    required this.value,
    required this.onChanged,
    this.label,
    this.allowEmpty = false,
  });

  final int? value;
  final ValueChanged<int?> onChanged;
  final String? label;
  final bool allowEmpty;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final professionsAsync = ref.watch(professionsProvider);
    return AsyncView(
      value: professionsAsync,
      data: (professions) {
        return DropdownButtonFormField<int>(
          value: value,
          decoration: InputDecoration(labelText: label ?? context.l10n.professionFieldLabel),
          isExpanded: true,
          items: [
            if (allowEmpty) DropdownMenuItem<int>(value: null, child: Text(context.l10n.allFilterOption)),
            ...professions.map((p) => DropdownMenuItem(value: p.id, child: Text(p.name, overflow: TextOverflow.ellipsis))),
          ],
          onChanged: onChanged,
        );
      },
    );
  }
}
