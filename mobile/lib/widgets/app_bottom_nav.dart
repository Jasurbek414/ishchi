import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Extra bottom padding scrollable tab content needs so its last item isn't
/// hidden behind the floating [AppBottomNav] pill once the Scaffold uses
/// `extendBody: true` (required so the pill's frosted-glass blur has real
/// page content behind it instead of a flat, unrelated background color).
///
/// Under a Scaffold with `extendBody: true` the body's MediaQuery bottom padding ALREADY includes
/// the height of the bottom bar (measured: 80 = 66 + 14 on a phone without a gesture bar). The old
/// formula added the bar's height on top of that, so lists ended 80 px too early and, worse, the
/// "new job" button floated ~108 px above the bar instead of ~16 px.
double bottomNavClearance(BuildContext context) {
  return MediaQuery.paddingOf(context).bottom + 12;
}

class NavItem {
  const NavItem({required this.icon, required this.activeIcon, required this.label});

  final IconData icon;
  final IconData activeIcon;
  final String label;
}

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<NavItem> items;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 14),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(26),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
          child: Container(
            height: 66,
            decoration: BoxDecoration(
              color: cs.surface.withValues(alpha: 0.72),
              borderRadius: BorderRadius.circular(26),
              border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.5), width: 1),
              boxShadow: [
                BoxShadow(color: cs.shadow.withValues(alpha: 0.08), blurRadius: 24, offset: const Offset(0, 10)),
              ],
            ),
            child: Row(
              children: List.generate(items.length, (i) {
                final selected = i == currentIndex;
                return Expanded(
                  child: _NavButton(
                    item: items[i],
                    selected: selected,
                    onTap: () {
                      if (!selected) {
                        HapticFeedback.selectionClick();
                        onTap(i);
                      }
                    },
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavButton extends StatelessWidget {
  const _NavButton({required this.item, required this.selected, required this.onTap});

  final NavItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = selected ? cs.primary : cs.onSurfaceVariant;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 240),
          curve: Curves.easeOutCubic,
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: selected ? cs.primary.withValues(alpha: 0.12) : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(selected ? item.activeIcon : item.icon, color: color, size: 22),
              const SizedBox(height: 3),
              Text(
                item.label,
                maxLines: 1,
                softWrap: false,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: color,
                  fontSize: 10,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
