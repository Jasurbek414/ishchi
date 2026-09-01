import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/profession.dart';
import 'core_providers.dart';

final professionsProvider = FutureProvider<List<Profession>>((ref) {
  return ref.watch(professionRepositoryProvider).getProfessions();
});
