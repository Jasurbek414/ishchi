import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/page_response.dart';
import '../models/wallet.dart';
import 'core_providers.dart';

class WalletNotifier extends AsyncNotifier<Wallet> {
  @override
  Future<Wallet> build() {
    return ref.read(walletRepositoryProvider).getWallet();
  }

  Future<void> topUp(num amount) async {
    final wallet = await ref.read(walletRepositoryProvider).topUp(amount);
    state = AsyncData(wallet);
    ref.invalidate(walletTransactionsProvider);
  }
}

final walletProvider = AsyncNotifierProvider<WalletNotifier, Wallet>(WalletNotifier.new);

final walletTransactionsProvider = FutureProvider<PageResponse<WalletTransaction>>((ref) {
  return ref.watch(walletRepositoryProvider).getTransactions(size: 50);
});
