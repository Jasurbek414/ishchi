import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/api_client.dart';
import '../core/token_storage.dart';
import '../data/auth_repository.dart';
import '../data/employer_repository.dart';
import '../data/job_application_repository.dart';
import '../data/geo_repository.dart';
import '../data/job_repository.dart';
import '../data/rating_repository.dart';
import '../data/report_repository.dart';
import '../data/saved_search_repository.dart';
import '../data/notification_repository.dart';
import '../data/location_repository.dart';
import '../data/profession_repository.dart';
import '../data/app_settings_repository.dart';
import '../data/profile_repository.dart';
import '../data/promo_banner_repository.dart';
import '../data/wallet_repository.dart';
import '../data/worker_repository.dart';

/// Overridden in `main()` with an instance opened before `runApp`, so providers that restore a
/// saved setting can read it synchronously on their first build. Reading it asynchronously made
/// the app paint its first frames with the default colour/language and then visibly switch once
/// the stored value arrived.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('sharedPreferencesProvider must be overridden in main()'),
);

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(tokenStorageProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) => AuthRepository(ref.watch(apiClientProvider)));

final locationRepositoryProvider =
    Provider<LocationRepository>((ref) => LocationRepository(ref.watch(apiClientProvider)));

final professionRepositoryProvider =
    Provider<ProfessionRepository>((ref) => ProfessionRepository(ref.watch(apiClientProvider)));

final profileRepositoryProvider =
    Provider<ProfileRepository>((ref) => ProfileRepository(ref.watch(apiClientProvider)));

final jobRepositoryProvider = Provider<JobRepository>((ref) => JobRepository(ref.watch(apiClientProvider)));

final workerRepositoryProvider =
    Provider<WorkerRepository>((ref) => WorkerRepository(ref.watch(apiClientProvider)));

final walletRepositoryProvider =
    Provider<WalletRepository>((ref) => WalletRepository(ref.watch(apiClientProvider)));

final promoBannerRepositoryProvider =
    Provider<PromoBannerRepository>((ref) => PromoBannerRepository(ref.watch(apiClientProvider)));

final appSettingsRepositoryProvider =
    Provider<AppSettingsRepository>((ref) => AppSettingsRepository(ref.watch(apiClientProvider)));

final employerRepositoryProvider =
    Provider<EmployerRepository>((ref) => EmployerRepository(ref.watch(apiClientProvider)));

final notificationRepositoryProvider =
    Provider<NotificationRepository>((ref) => NotificationRepository(ref.watch(apiClientProvider)));

final jobApplicationRepositoryProvider =
    Provider<JobApplicationRepository>((ref) => JobApplicationRepository(ref.watch(apiClientProvider)));

final ratingRepositoryProvider =
    Provider<RatingRepository>((ref) => RatingRepository(ref.watch(apiClientProvider)));

final savedSearchRepositoryProvider =
    Provider<SavedSearchRepository>((ref) => SavedSearchRepository(ref.watch(apiClientProvider)));

final reportRepositoryProvider =
    Provider<ReportRepository>((ref) => ReportRepository(ref.watch(apiClientProvider)));

final geoRepositoryProvider = Provider<GeoRepository>((ref) => GeoRepository(ref.watch(apiClientProvider)));
