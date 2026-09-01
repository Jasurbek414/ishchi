import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

import '../l10n/l10n_x.dart';

class Formatters {
  static final _moneyFormat = NumberFormat.decimalPattern('uz');
  static final _dateFormat = DateFormat('dd.MM.yyyy');
  static final _dateTimeFormat = DateFormat('dd.MM.yyyy HH:mm');

  static String money(BuildContext context, num value) =>
      context.l10n.moneySom(_moneyFormat.format(value));

  static String date(DateTime value) => _dateFormat.format(value);

  static String dateTime(DateTime value) => _dateTimeFormat.format(value.toLocal());

  static String timeAgo(BuildContext context, DateTime value) {
    final diff = DateTime.now().difference(value.toLocal());
    if (diff.inMinutes < 1) return context.l10n.timeAgoJustNow;
    if (diff.inMinutes < 60) return context.l10n.timeAgoMinutes(diff.inMinutes);
    if (diff.inHours < 24) return context.l10n.timeAgoHours(diff.inHours);
    if (diff.inDays < 30) return context.l10n.timeAgoDays(diff.inDays);
    return date(value);
  }
}
