import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/enums.dart';
import 'core_providers.dart';
import 'job_providers.dart';
import 'profile_provider.dart';
import 'employer_providers.dart';
import 'promo_banner_providers.dart';
import 'wallet_provider.dart';
import 'worker_providers.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthState {
  const AuthState({required this.status, this.role, this.userId});

  final AuthStatus status;
  final UserRole? role;
  final int? userId;

  static const initial = AuthState(status: AuthStatus.unknown);

  AuthState copyWith({AuthStatus? status, UserRole? role, int? userId}) => AuthState(
        status: status ?? this.status,
        role: role ?? this.role,
        userId: userId ?? this.userId,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier(this._ref) : super(AuthState.initial) {
    _ref.read(apiClientProvider).onSessionExpired = () {
      state = const AuthState(status: AuthStatus.unauthenticated);
    };
    _restore();
  }

  final Ref _ref;

  Future<void> _restore() async {
    final storage = _ref.read(tokenStorageProvider);
    final token = await storage.accessToken;
    final roleStr = await storage.role;
    final userId = await storage.userId;
    if (token != null && roleStr != null && userId != null) {
      state = AuthState(status: AuthStatus.authenticated, role: UserRole.fromApi(roleStr), userId: userId);
    } else {
      state = const AuthState(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login({required String phone, required String password}) async {
    final result = await _ref.read(authRepositoryProvider).login(phone: phone, password: password);
    await _ref.read(tokenStorageProvider).saveSession(
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          userId: result.userId,
          role: result.role.apiValue,
        );
    _invalidateUserScopedProviders();
    state = AuthState(status: AuthStatus.authenticated, role: result.role, userId: result.userId);
  }

  Future<void> switchRole({List<int>? professionIds}) async {
    final result = await _ref.read(authRepositoryProvider).switchRole(professionIds: professionIds);
    await _ref.read(tokenStorageProvider).saveSession(
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          userId: result.userId,
          role: result.role.apiValue,
        );
    _invalidateUserScopedProviders();
    state = AuthState(status: AuthStatus.authenticated, role: result.role, userId: result.userId);
  }

  Future<void> logout() async {
    final storage = _ref.read(tokenStorageProvider);
    final refreshToken = await storage.refreshToken;
    if (refreshToken != null) {
      try {
        await _ref.read(authRepositoryProvider).logout(refreshToken);
      } catch (_) {
        // best-effort; local session is cleared regardless
      }
    }
    await storage.clear();
    _invalidateUserScopedProviders();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  /// Clears cached per-user data so a different account logging in on the same
  /// app instance never shows the previous user's profile/wallet/jobs.
  void _invalidateUserScopedProviders() {
    _ref.invalidate(profileProvider);
    _ref.invalidate(walletProvider);
    _ref.invalidate(walletTransactionsProvider);
    _ref.invalidate(myJobsProvider);
    _ref.invalidate(jobsSearchProvider);
    _ref.invalidate(jobsMapProvider);
    _ref.invalidate(workersSearchProvider);
    _ref.invalidate(workersMapProvider);
    _ref.invalidate(employersMapProvider);
    _ref.invalidate(promoBannersProvider);
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier(ref));
