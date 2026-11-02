import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/l10n_x.dart';
import '../state/location_providers.dart';

class RegionDistrictSelector extends ConsumerWidget {
  const RegionDistrictSelector({
    super.key,
    required this.regionId,
    required this.districtId,
    required this.onChanged,
  });

  final int? regionId;
  final int? districtId;
  final void Function(int? regionId, int? districtId) onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final regionsAsync = ref.watch(regionsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        regionsAsync.when(
          data: (regions) => DropdownButtonFormField<int>(
            value: regionId,
            decoration: InputDecoration(labelText: context.l10n.regionFieldLabel),
            isExpanded: true,
            items: regions
                .map((r) => DropdownMenuItem(value: r.id, child: Text(r.name, overflow: TextOverflow.ellipsis)))
                .toList(),
            onChanged: (value) => onChanged(value, null),
          ),
          loading: () => const LinearProgressIndicator(),
          error: (e, _) => Text(context.l10n.regionsLoadError(e.toString())),
        ),
        const SizedBox(height: 12),
        if (regionId != null)
          Consumer(
            builder: (context, ref, _) {
              final districtsAsync = ref.watch(districtsProvider(regionId!));
              return districtsAsync.when(
                data: (districts) => DropdownButtonFormField<int>(
                  value: districts.any((d) => d.id == districtId) ? districtId : null,
                  decoration: InputDecoration(labelText: context.l10n.districtFieldLabel),
                  isExpanded: true,
                  items: districts
                      .map((d) => DropdownMenuItem(value: d.id, child: Text(d.name, overflow: TextOverflow.ellipsis)))
                      .toList(),
                  onChanged: (value) => onChanged(regionId, value),
                ),
                loading: () => const LinearProgressIndicator(),
                error: (e, _) => Text(context.l10n.districtsLoadError(e.toString())),
              );
            },
          ),
      ],
    );
  }
}
