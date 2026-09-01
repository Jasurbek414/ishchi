import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../state/profession_providers.dart';
import 'async_view.dart';

class ProfessionMultiSelector extends ConsumerWidget {
  const ProfessionMultiSelector({super.key, required this.selectedIds, required this.onChanged});

  final Set<int> selectedIds;
  final void Function(Set<int> selected) onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final professionsAsync = ref.watch(professionsProvider);
    return AsyncView(
      value: professionsAsync,
      data: (professions) {
        final byCategory = <String, List<dynamic>>{};
        for (final p in professions) {
          byCategory.putIfAbsent(p.category, () => []).add(p);
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: byCategory.entries.map((entry) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(entry.key, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: entry.value.map<Widget>((p) {
                      final selected = selectedIds.contains(p.id);
                      return FilterChip(
                        label: Text(p.name),
                        selected: selected,
                        onSelected: (value) {
                          final next = Set<int>.from(selectedIds);
                          if (value) {
                            next.add(p.id);
                          } else {
                            next.remove(p.id);
                          }
                          onChanged(next);
                        },
                      );
                    }).toList(),
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}
