import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../l10n/l10n_x.dart';
import '../state/locale_provider.dart';

class LanguageSettingsScreen extends ConsumerWidget {
  const LanguageSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(localeProvider);
    final notifier = ref.read(localeProvider.notifier);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.languageSettingsTitle)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          Text(
            context.l10n.chooseLanguage,
            style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant, letterSpacing: 0.4),
          ),
          const SizedBox(height: 12),
          for (final language in AppLanguage.values) ...[
            _LanguageTile(
              language: language,
              selected: language == current,
              onTap: () => notifier.setLanguage(language),
            ),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class _LanguageTile extends StatelessWidget {
  const _LanguageTile({required this.language, required this.selected, required this.onTap});

  final AppLanguage language;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: selected ? cs.primaryContainer : cs.surfaceContainer,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? cs.primary : cs.outlineVariant, width: selected ? 2 : 1),
        ),
        child: Row(
          children: [
            Icon(
              selected ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill) : PhosphorIcons.circle(),
              color: selected ? cs.primary : cs.onSurfaceVariant,
              size: 22,
            ),
            const SizedBox(width: 14),
            Text(
              language.nativeName,
              style: TextStyle(
                fontSize: 15.5,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? cs.primary : cs.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
