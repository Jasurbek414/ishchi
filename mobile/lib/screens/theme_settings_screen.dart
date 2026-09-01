import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../l10n/l10n_x.dart';
import '../state/theme_provider.dart';

class ThemeSettingsScreen extends ConsumerWidget {
  const ThemeSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeState = ref.watch(themeProvider);
    final notifier = ref.read(themeProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.themeMenu)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        children: [
          // ─── Rejim tanlash ─────────────────────────────────────────────────
          _SectionTitle(title: context.l10n.appearanceModeSection),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _ModeCard(
                  icon: PhosphorIcons.sun(PhosphorIconsStyle.fill),
                  label: context.l10n.themeModeLight,
                  selected: themeState.themeMode == ThemeMode.light,
                  onTap: () => notifier.setThemeMode(ThemeMode.light),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ModeCard(
                  icon: PhosphorIcons.moon(PhosphorIconsStyle.fill),
                  label: context.l10n.themeModeDark,
                  selected: themeState.themeMode == ThemeMode.dark,
                  onTap: () => notifier.setThemeMode(ThemeMode.dark),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ModeCard(
                  icon: PhosphorIcons.deviceMobile(PhosphorIconsStyle.fill),
                  label: context.l10n.themeModeAuto,
                  selected: themeState.themeMode == ThemeMode.system,
                  onTap: () => notifier.setThemeMode(ThemeMode.system),
                ),
              ),
            ],
          ),

          const SizedBox(height: 28),

          // ─── Rang tanlash ──────────────────────────────────────────────────
          _SectionTitle(title: context.l10n.primaryColorSection),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 0.85,
            ),
            itemCount: kColorPalettes.length,
            itemBuilder: (context, index) {
              final palette = kColorPalettes[index];
              final isSelected =
                  themeState.seedColor.toARGB32() == palette.color.toARGB32();
              return _ColorTile(
                palette: palette,
                selected: isSelected,
                onTap: () => notifier.setSeedColor(palette.color),
              );
            },
          ),

          const SizedBox(height: 28),

          // ─── Preview ───────────────────────────────────────────────────────
          _SectionTitle(title: context.l10n.previewSection),
          const SizedBox(height: 12),
          _PreviewCard(seedColor: themeState.seedColor),
        ],
      ),
    );
  }
}

// ─── Section title ────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Text(
      title,
      style: TextStyle(
        fontSize: 13.5,
        fontWeight: FontWeight.w600,
        color: cs.onSurfaceVariant,
        letterSpacing: 0.4,
      ),
    );
  }
}

// ─── Rejim kartochkasi ────────────────────────────────────────────────────────

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: selected ? cs.primaryContainer : cs.surfaceContainer,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? cs.primary : cs.outlineVariant,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              size: 26,
              color: selected ? cs.primary : cs.onSurfaceVariant,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? cs.primary : cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Rang katak ───────────────────────────────────────────────────────────────

String _paletteName(BuildContext context, AppColorPalette palette) => switch (palette.id) {
      'burntOrange' => context.l10n.colorBurntOrange,
      'blue' => context.l10n.colorBlue,
      'green' => context.l10n.colorGreen,
      'violet' => context.l10n.colorViolet,
      'red' => context.l10n.colorRed,
      'amber' => context.l10n.colorAmber,
      'cyan' => context.l10n.colorCyan,
      'brown' => context.l10n.colorBrown,
      _ => palette.id,
    };

class _ColorTile extends StatelessWidget {
  const _ColorTile({
    required this.palette,
    required this.selected,
    required this.onTap,
  });

  final AppColorPalette palette;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? palette.color : Colors.transparent,
            width: 2.5,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: selected ? 50 : 44,
              height: selected ? 50 : 44,
              decoration: BoxDecoration(
                color: palette.color,
                shape: BoxShape.circle,
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: palette.color.withValues(alpha: 0.45),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : [],
              ),
              child: selected
                  ? const Icon(Icons.check, color: Colors.white, size: 20)
                  : null,
            ),
            const SizedBox(height: 6),
            Text(
              _paletteName(context, palette),
              textAlign: TextAlign.center,
              maxLines: 2,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: selected ? palette.color : Theme.of(context).colorScheme.onSurfaceVariant,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Preview kartochkasi ─────────────────────────────────────────────────────

class _PreviewCard extends StatelessWidget {
  const _PreviewCard({required this.seedColor});
  final Color seedColor;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: cs.surfaceContainer,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: cs.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Avatar + ism
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: seedColor,
                child: const Icon(Icons.person, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    context.l10n.previewPersonName,
                    style: TextStyle(fontWeight: FontWeight.w700, color: cs.onSurface, fontSize: 14),
                  ),
                  Text(
                    context.l10n.roleWorker,
                    style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Tugmalar
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: seedColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    context.l10n.contactAction,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  height: 40,
                  decoration: BoxDecoration(
                    border: Border.all(color: seedColor),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    context.l10n.profileTitle,
                    style: TextStyle(color: seedColor, fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          // Chip-lar
          Wrap(
            spacing: 8,
            children: [
              _PreviewChip(label: context.l10n.previewSkillConstruction, color: seedColor),
              _PreviewChip(label: context.l10n.previewSkillAssistant, color: seedColor),
              _PreviewChip(label: context.l10n.previewCityTashkent, color: seedColor),
            ],
          ),
        ],
      ),
    );
  }
}

class _PreviewChip extends StatelessWidget {
  const _PreviewChip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}
