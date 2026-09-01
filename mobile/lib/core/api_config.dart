class ApiConfig {
  /// Defaults to the production API so a plain `flutter build apk --release` (no extra
  /// flags) always produces something that works on a real phone. For local development
  /// against a backend running on this machine, override with:
  /// --dart-define=API_BASE_URL=http://10.0.2.2:8090/api (Android emulator)
  /// --dart-define=API_BASE_URL=http://localhost:8090/api (iOS simulator)
  static String get baseUrl {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;
    return 'https://ishchi-api.ecos.uz/api';
  }

  /// Resolves a relative media path (e.g. "/uploads/job-images/x.png") returned by the
  /// backend into an absolute URL, using the same host as [baseUrl].
  static String resolveMediaUrl(String path) {
    if (path.startsWith('http')) return path;
    final base = baseUrl.replaceFirst(RegExp(r'/api/?$'), '');
    return '$base$path';
  }
}
