import 'enums.dart';

class AuthResult {
  AuthResult({
    required this.accessToken,
    required this.refreshToken,
    required this.userId,
    required this.role,
  });

  final String accessToken;
  final String refreshToken;
  final int userId;
  final UserRole role;

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
        userId: json['userId'] as int,
        role: UserRole.fromApi(json['role'] as String),
      );
}

/// Result of register/resend-otp/forgot-password. When [telegramLinkUrl] is set, no code has
/// been sent yet — the user must open the Telegram bot first; the code is dispatched
/// automatically once the backend sees them link.
class OtpDispatchResult {
  OtpDispatchResult({required this.message, this.telegramLinkUrl});

  final String message;
  final String? telegramLinkUrl;

  factory OtpDispatchResult.fromJson(Map<String, dynamic> json) => OtpDispatchResult(
        message: json['message'] as String,
        telegramLinkUrl: json['telegramLinkUrl'] as String?,
      );
}
