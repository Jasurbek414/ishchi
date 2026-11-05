import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../models/in_app_notification.dart';
import '../state/in_app_notification_provider.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  String _formatTimestamp(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);

    if (diff.inMinutes < 1) return "Hozirgina";
    if (diff.inMinutes < 60) return "${diff.inMinutes} daqiqa oldin";
    if (diff.inHours < 24 && now.day == dt.day) {
      return "Bugun, ${DateFormat('HH:mm').format(dt)}";
    }
    if (diff.inDays < 2 && (now.day - dt.day == 1 || diff.inHours < 48)) {
      return "Kecha, ${DateFormat('HH:mm').format(dt)}";
    }
    return DateFormat('dd.MM.yyyy, HH:mm').format(dt);
  }

  IconData _iconForType(NotificationType type) {
    return switch (type) {
      NotificationType.job => Icons.work_outline_rounded,
      NotificationType.application => Icons.assignment_ind_outlined,
      NotificationType.broadcast => Icons.campaign_outlined,
      NotificationType.system => Icons.notifications_none_rounded,
    };
  }

  Color _iconColorForType(NotificationType type, ColorScheme cs) {
    return switch (type) {
      NotificationType.job => cs.primary,
      NotificationType.application => const Color(0xFF16A34A),
      NotificationType.broadcast => const Color(0xFFE8541F),
      NotificationType.system => const Color(0xFF64748B),
    };
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(inAppNotificationsProvider);
    final cs = Theme.of(context).colorScheme;
    final unreadCount = notifications.where((n) => !n.isRead).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Bildirishnomalar',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        actions: [
          if (notifications.isNotEmpty)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (value) {
                if (value == 'read_all') {
                  ref.read(inAppNotificationsProvider.notifier).markAllAsRead();
                } else if (value == 'clear_all') {
                  ref.read(inAppNotificationsProvider.notifier).clearAll();
                }
              },
              itemBuilder: (context) => [
                if (unreadCount > 0)
                  const PopupMenuItem(
                    value: 'read_all',
                    child: Row(
                      children: [
                        Icon(Icons.done_all, size: 20),
                        SizedBox(width: 8),
                        Text("Barchasini o'qilgan qilish"),
                      ],
                    ),
                  ),
                const PopupMenuItem(
                  value: 'clear_all',
                  child: Row(
                    children: [
                      Icon(Icons.delete_outline, size: 20),
                      SizedBox(width: 8),
                      Text("Hammasini o'chirish"),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
      body: notifications.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerHighest.withValues(alpha: 0.5),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.notifications_off_outlined,
                        size: 40,
                        color: cs.onSurfaceVariant.withValues(alpha: 0.6),
                      ),
                    ),
                    const SizedBox(height: 18),
                    const Text(
                      "Bildirishnomalar yo'q",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Sizga kelgan barcha yangi ishlar, arizalar va muhim xabarnomalar shu yerda ko'rinadi.",
                      textAlign: TextAlign.center,
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 14, height: 1.4),
                    ),
                  ],
                ),
              ),
            )
          : ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: notifications.length,
              separatorBuilder: (context, index) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = notifications[index];
                final iconColor = _iconColorForType(item.type, cs);

                return Dismissible(
                  key: Key(item.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 20),
                    decoration: BoxDecoration(
                      color: cs.error,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.delete_outline, color: Colors.white),
                  ),
                  onDismissed: (_) {
                    ref.read(inAppNotificationsProvider.notifier).removeNotification(item.id);
                  },
                  child: Material(
                    color: item.isRead
                        ? cs.surface
                        : cs.primaryContainer.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: BorderSide(
                        color: item.isRead
                            ? cs.outlineVariant.withValues(alpha: 0.4)
                            : cs.primary.withValues(alpha: 0.3),
                        width: 1,
                      ),
                    ),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        if (!item.isRead) {
                          ref.read(inAppNotificationsProvider.notifier).markAsRead(item.id);
                        }
                        if (item.jobId != null) {
                          context.push('/worker/jobs/${item.jobId}');
                        }
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: iconColor.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                _iconForType(item.type),
                                color: iconColor,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          item.title,
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: item.isRead
                                                ? FontWeight.w600
                                                : FontWeight.w800,
                                            color: cs.onSurface,
                                          ),
                                        ),
                                      ),
                                      if (!item.isRead)
                                        Container(
                                          width: 8,
                                          height: 8,
                                          margin: const EdgeInsets.only(left: 6),
                                          decoration: BoxDecoration(
                                            color: cs.primary,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    item.body,
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: cs.onSurfaceVariant,
                                      height: 1.35,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    _formatTimestamp(item.createdAt),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: cs.onSurfaceVariant.withValues(alpha: 0.7),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
