import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Bridges a Riverpod provider to a [Listenable] so GoRouter can react to auth changes.
class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(Ref ref, ProviderListenable listenable) {
    ref.listen(listenable, (_, __) => notifyListeners());
  }
}
