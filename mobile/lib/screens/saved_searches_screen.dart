import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/api_exception.dart';
import '../l10n/l10n_x.dart';
import '../models/enums.dart';
import '../models/saved_search.dart';
import '../state/core_providers.dart';
import '../state/location_providers.dart';
import '../state/profession_providers.dart';
import '../state/saved_search_providers.dart';
import '../widgets/async_view.dart';
import '../widgets/empty_state.dart';

/// Filters the worker asked to be told about.
///
/// Matching workers were already notified of every job in their trade and region, which is blunt
/// enough that people stop reading the notifications. This narrows it to what they would travel for.
class SavedSearchesScreen extends ConsumerWidget {
  const SavedSearchesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final searchesAsync = ref.watch(savedSearchesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.savedSearchesMenu)),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditor(context, ref, null),
        icon: const Icon(Icons.add),
        label: Text(context.l10n.savedSearchAddAction),
      ),
      body: AsyncView(
        value: searchesAsync,
        onRetry: () => ref.invalidate(savedSearchesProvider),
        data: (searches) {
          if (searches.isEmpty) {
            return EmptyState(
              icon: Icons.notifications_active_outlined,
              message: context.l10n.savedSearchEmpty,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
            itemCount: searches.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, index) => _SavedSearchTile(search: searches[index]),
          );
        },
      ),
    );
  }

  static Future<void> _openEditor(BuildContext context, WidgetRef ref, SavedSearch? existing) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: _SavedSearchEditor(existing: existing),
      ),
    );
    if (saved == true) {
      ref.invalidate(savedSearchesProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(context.l10n.savedSearchSavedSuccess)));
      }
    }
  }
}

class _SavedSearchTile extends ConsumerWidget {
  const _SavedSearchTile({required this.search});

  final SavedSearch search;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final parts = <String>[
      if (search.professionName != null) search.professionName!,
      if (search.regionName != null) search.regionName!,
      if (search.districtName != null) search.districtName!,
      if (search.jobType != null) search.jobType!.label(context),
    ];

    return Card(
      child: ListTile(
        leading: Icon(
          search.notifyEnabled ? Icons.notifications_active_outlined : Icons.notifications_off_outlined,
          color: search.notifyEnabled ? cs.primary : cs.onSurfaceVariant,
        ),
        title: Text(search.name, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: parts.isEmpty
            ? null
            : Text(parts.join(' · '), style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
        trailing: IconButton(
          icon: Icon(Icons.delete_outline, color: cs.error),
          onPressed: () async {
            try {
              await ref.read(savedSearchRepositoryProvider).delete(search.id);
              ref.invalidate(savedSearchesProvider);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context)
                  .showSnackBar(SnackBar(content: Text(context.l10n.savedSearchDeletedSuccess)));
            } on ApiException catch (e) {
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
            }
          },
        ),
        onTap: () => SavedSearchesScreen._openEditor(context, ref, search),
      ),
    );
  }
}

class _SavedSearchEditor extends ConsumerStatefulWidget {
  const _SavedSearchEditor({this.existing});

  final SavedSearch? existing;

  @override
  ConsumerState<_SavedSearchEditor> createState() => _SavedSearchEditorState();
}

class _SavedSearchEditorState extends ConsumerState<_SavedSearchEditor> {
  late final TextEditingController _nameController;
  late final TextEditingController _minPaymentController;
  int? _professionId;
  int? _regionId;
  JobType? _jobType;
  late bool _notify;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _nameController = TextEditingController(text: existing?.name ?? '');
    _minPaymentController =
        TextEditingController(text: existing?.minPayment == null ? '' : '${existing!.minPayment!.toInt()}');
    _professionId = existing?.professionId;
    _regionId = existing?.regionId;
    _jobType = existing?.jobType;
    _notify = existing?.notifyEnabled ?? true;
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _error = context.l10n.savedSearchNameLabel);
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final repository = ref.read(savedSearchRepositoryProvider);
      final minPayment = num.tryParse(_minPaymentController.text.trim());
      if (widget.existing == null) {
        await repository.create(
          name: name,
          professionId: _professionId,
          regionId: _regionId,
          jobType: _jobType,
          minPayment: minPayment,
          notifyEnabled: _notify,
        );
      } else {
        await repository.update(
          widget.existing!.id,
          name: name,
          professionId: _professionId,
          regionId: _regionId,
          jobType: _jobType,
          minPayment: minPayment,
          notifyEnabled: _notify,
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _minPaymentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final professionsAsync = ref.watch(professionsProvider);
    final regionsAsync = ref.watch(regionsProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(context.l10n.savedSearchesMenu,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 14),
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: context.l10n.savedSearchNameLabel),
            ),
            const SizedBox(height: 12),
            professionsAsync.maybeWhen(
              data: (professions) => DropdownButtonFormField<int?>(
                value: _professionId,
                isExpanded: true,
                decoration: InputDecoration(labelText: context.l10n.anyProfessionOption),
                items: [
                  DropdownMenuItem<int?>(value: null, child: Text(context.l10n.anyProfessionOption)),
                  ...professions.map((p) =>
                      DropdownMenuItem<int?>(value: p.id, child: Text(p.name, overflow: TextOverflow.ellipsis))),
                ],
                onChanged: (value) => setState(() => _professionId = value),
              ),
              orElse: () => const SizedBox.shrink(),
            ),
            const SizedBox(height: 12),
            regionsAsync.maybeWhen(
              data: (regions) => DropdownButtonFormField<int?>(
                value: _regionId,
                isExpanded: true,
                decoration: InputDecoration(labelText: context.l10n.anyRegionOption),
                items: [
                  DropdownMenuItem<int?>(value: null, child: Text(context.l10n.anyRegionOption)),
                  ...regions.map((r) =>
                      DropdownMenuItem<int?>(value: r.id, child: Text(r.name, overflow: TextOverflow.ellipsis))),
                ],
                onChanged: (value) => setState(() => _regionId = value),
              ),
              orElse: () => const SizedBox.shrink(),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<JobType?>(
              value: _jobType,
              isExpanded: true,
              decoration: InputDecoration(labelText: context.l10n.anyJobTypeOption),
              items: [
                DropdownMenuItem<JobType?>(value: null, child: Text(context.l10n.anyJobTypeOption)),
                ...JobType.values
                    .map((t) => DropdownMenuItem<JobType?>(value: t, child: Text(t.label(context)))),
              ],
              onChanged: (value) => setState(() => _jobType = value),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _minPaymentController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(labelText: context.l10n.savedSearchMinPaymentLabel),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _notify,
              onChanged: (value) => setState(() => _notify = value),
              title: Text(context.l10n.savedSearchNotifyLabel, style: const TextStyle(fontSize: 14)),
            ),
            if (_error != null) ...[
              Text(_error!, style: TextStyle(color: cs.error, fontSize: 13)),
              const SizedBox(height: 8),
            ],
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(context.l10n.saveAction),
            ),
          ],
        ),
      ),
    );
  }
}
