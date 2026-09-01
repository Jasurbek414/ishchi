import '../core/api_client.dart';
import '../models/page_response.dart';
import '../models/wallet.dart';

class WalletRepository {
  WalletRepository(this._client);

  final ApiClient _client;

  Future<Wallet> getWallet() async {
    final res = await _client.get('/wallet');
    return Wallet.fromJson(res);
  }

  Future<PageResponse<WalletTransaction>> getTransactions({int page = 0, int size = 20}) async {
    final res = await _client.get('/wallet/transactions', query: {'page': page, 'size': size});
    return PageResponse.fromJson(res, WalletTransaction.fromJson);
  }

  Future<Wallet> topUp(num amount) async {
    final res = await _client.post('/wallet/topup', data: {'amount': amount});
    return Wallet.fromJson(res);
  }
}
