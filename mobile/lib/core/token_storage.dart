import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  TokenStorage() : _storage = const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const _accessKey = 'access_token';
  static const _refreshKey = 'refresh_token';
  static const _userIdKey = 'user_id';
  static const _roleKey = 'role';

  Future<void> saveSession({
    required String accessToken,
    required String refreshToken,
    required int userId,
    required String role,
  }) async {
    await Future.wait([
      _storage.write(key: _accessKey, value: accessToken),
      _storage.write(key: _refreshKey, value: refreshToken),
      _storage.write(key: _userIdKey, value: userId.toString()),
      _storage.write(key: _roleKey, value: role),
    ]);
  }

  Future<void> saveAccessToken(String accessToken) =>
      _storage.write(key: _accessKey, value: accessToken);

  Future<String?> get accessToken => _storage.read(key: _accessKey);

  Future<String?> get refreshToken => _storage.read(key: _refreshKey);

  Future<String?> get role => _storage.read(key: _roleKey);

  Future<int?> get userId async {
    final value = await _storage.read(key: _userIdKey);
    return value == null ? null : int.tryParse(value);
  }

  Future<void> clear() => _storage.deleteAll();
}
