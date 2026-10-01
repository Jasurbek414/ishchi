import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../l10n/l10n_x.dart';
import '../state/locale_provider.dart';

/// A compact "🌐 O'zbekcha" button that opens a sheet with the four languages. Used before sign-in,
/// where the profile's language settings are not reachable yet.
class LanguageSwitcher extends ConsumerWidget {
  const LanguageSwitcher({super.key});

  Future<void> _choose(BuildContext context, WidgetRef ref, AppLanguage current) async {
    final picked = await showModalBottomSheet<AppLanguage>(
      context: context,
      showDragHandle: true,
      builder: (sheetContext) {
        final cs = Theme.of(sheetContext).colorScheme;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 0, 8, 10),
                  child: Text(sheetContext.l10n.chooseLanguage,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                ),
                for (final language in AppLanguage.values)
                  ListTile(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    selected: language == current,
                    selectedTileColor: cs.primary.withValues(alpha: 0.08),
                    leading: CircleAvatar(
                      radius: 17,
                      backgroundColor: cs.primary.withValues(alpha: language == current ? 0.16 : 0.08),
                      child: Text(_code(language),
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: cs.primary)),
                    ),
                    title: Text(language.nativeName, style: const TextStyle(fontWeight: FontWeight.w600)),
                    trailing: language == current ? Icon(Icons.check_circle, color: cs.primary) : null,
                    onTap: () => Navigator.pop(sheetContext, language),
                  ),
              ],
            ),
          ),
        );
      },
    );
    if (picked != null && picked != current) {
      await ref.read(localeProvider.notifier).setLanguage(picked);
    }
  }

  /// A short tag rather than a flag emoji, which some phones draw as two empty boxes.
  static String _code(AppLanguage language) => switch (language) {
        AppLanguage.uzLatin => 'UZ',
        AppLanguage.uzCyrillic => 'ЎЗ',
        AppLanguage.russian => 'RU',
        AppLanguage.english => 'EN',
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(localeProvider);
    final cs = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: context.l10n.chooseLanguage,
      child: Material(
        color: cs.surfaceContainerHighest.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(22),
        child: InkWell(
          borderRadius: BorderRadius.circular(22),
          onTap: () => _choose(context, ref, current),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.language, size: 18, color: cs.primary),
                const SizedBox(width: 6),
                Text(current.nativeName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13.5)),
                const SizedBox(width: 2),
                Icon(Icons.expand_more, size: 18, color: cs.onSurfaceVariant),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
