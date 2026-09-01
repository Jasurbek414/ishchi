import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/app_settings.dart';
import 'core_providers.dart';

final appSettingsProvider = FutureProvider<AppSettings>((ref) {
  return ref.watch(appSettingsRepositoryProvider).get();
});
