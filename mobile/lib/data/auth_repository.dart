import '../core/api_client.dart';
import '../models/auth_models.dart';
import '../models/enums.dart';

class AuthRepository {
  AuthRepository(this._client);

  final ApiClient _client;

  Future<OtpDispatchResult> register({
    required String phone,
    required String password,
    required String firstName,
    required String lastName,
    required UserRole role,
    required int regionId,
    required int districtId,
  }) async {
    final res = await _client.post('/auth/register', data: {
      'phone': phone,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'role': role.apiValue,
      'regionId': regionId,
      'districtId': districtId,
    });
    return OtpDispatchResult.fromJson(res);
  }

  Future<String> verifyOtp({required String phone, required String code}) async {
    final res = await _client.post('/auth/verify-otp', data: {'phone': phone, 'code': code});
    return res['message'] as String;
  }

  Future<OtpDispatchResult> resendOtp(String phone) async {
    final res = await _client.post('/auth/resend-otp', data: {'phone': phone});
    return OtpDispatchResult.fromJson(res);
  }

  Future<bool> telegramLinkStatus(String phone) async {
    final res = await _client.get('/auth/telegram-link-status', query: {'phone': phone});
    return res['linked'] as bool;
  }

  Future<AuthResult> login({required String phone, required String password}) async {
    final res = await _client.post('/auth/login', data: {'phone': phone, 'password': password});
    return AuthResult.fromJson(res);
  }

  Future<AuthResult> switchRole({List<int>? professionIds}) async {
    final res = await _client.post('/profile/switch-role', data: {
      if (professionIds != null) 'professionIds': professionIds,
    });
    return AuthResult.fromJson(res);
  }

  Future<void> logout(String refreshToken) async {
    await _client.post('/auth/logout', data: {'refreshToken': refreshToken});
  }

  Future<OtpDispatchResult> forgotPassword(String phone) async {
    final res = await _client.post('/auth/forgot-password', data: {'phone': phone});
    return OtpDispatchResult.fromJson(res);
  }

  Future<String> resetPassword({
    required String phone,
    required String code,
    required String newPassword,
  }) async {
    final res = await _client.post('/auth/reset-password', data: {
      'phone': phone,
      'code': code,
      'newPassword': newPassword,
    });
    return res['message'] as String;
  }

  /// Changes the password of the signed-in account by proving the current one, rather than going
  /// through the public forgot-password flow. Every other session is signed out server-side.
  Future<String> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final res = await _client.post('/profile/change-password', data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
    return res['message'] as String;
  }
}
