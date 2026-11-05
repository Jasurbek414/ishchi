import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../state/in_app_notification_provider.dart';

class NotificationBellButton extends ConsumerWidget {
  const NotificationBellButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadCount = ref.watch(unreadNotificationCountProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final badgeBorderColor = theme.appBarTheme.backgroundColor ??
        (isDark ? theme.colorScheme.surface : theme.colorScheme.surface);

    final hasUnread = unreadCount > 0;
    final countText = unreadCount > 99 ? '99+' : '$unreadCount';
    final isMultiDigit = unreadCount >= 10;

    return Semantics(
      label: hasUnread
          ? 'Bildirishnomalar, $unreadCount ta o\'qilmagan xabar'
          : 'Bildirishnomalar',
      button: true,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          IconButton(
            icon: Icon(
              hasUnread
                  ? Icons.notifications_rounded
                  : Icons.notifications_none_rounded,
              size: 24,
              color: hasUnread
                  ? theme.colorScheme.primary
                  : theme.colorScheme.onSurfaceVariant,
            ),
            tooltip: 'Bildirishnomalar',
            splashRadius: 22,
            onPressed: () => context.push('/notifications'),
          ),
          Positioned(
            top: 6,
            right: isMultiDigit ? 2 : 5,
            child: IgnorePointer(
              child: AnimatedScale(
                scale: hasUnread ? 1.0 : 0.0,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutBack,
                child: Container(
                  constraints: BoxConstraints(
                    minWidth: isMultiDigit ? 20 : 18,
                    minHeight: 18,
                  ),
                  padding: EdgeInsets.symmetric(
                    horizontal: isMultiDigit ? 5 : 2,
                    vertical: 1.5,
                  ),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Color(0xFFFF453A),
                        Color(0xFFE02424),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: badgeBorderColor,
                      width: 1.8,
                      strokeAlign: BorderSide.strokeAlignOutside,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFE02424).withValues(alpha: 0.45),
                        blurRadius: 6,
                        spreadRadius: 0.5,
                        offset: const Offset(0, 1.5),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      countText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        height: 1.05,
                        letterSpacing: -0.3,
                        fontFeatures: [],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
