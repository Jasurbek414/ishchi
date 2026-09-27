import 'package:dio/dio.dart';

import 'api_config.dart';
import 'api_exception.dart';
import 'token_storage.dart';

class ApiClient {
  ApiClient(this._tokenStorage) {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));

    // Same timeouts as the main client on purpose: without them a stalled refresh hangs forever,
    // and because every concurrent caller awaits the one in-flight refresh, the whole app hangs
    // with it.
    _refreshDio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _tokenStorage.accessToken;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final isAuthCall = error.requestOptions.path.startsWith('/auth/');
        // Multipart bodies handle their own retry (see _guardedMultipart) because a FormData
        // stream cannot be replayed once it has been sent.
        final handlesOwnRetry = error.requestOptions.extra[_skipInterceptorRetry] == true;
        if (error.response?.statusCode == 401 && !isAuthCall && !handlesOwnRetry) {
          final retried = await _retryWithRefreshedToken(error.requestOptions);
          if (retried != null) {
            return handler.resolve(retried);
          }
          onSessionExpired?.call();
        }
        handler.next(error);
      },
    ));
  }

  static const _skipInterceptorRetry = 'skipInterceptorRetry';

  late final Dio _dio;
  late final Dio _refreshDio;
  final TokenStorage _tokenStorage;

  /// Called when the refresh token itself is invalid/expired; the app should log the user out.
  void Function()? onSessionExpired;

  Future<Response<dynamic>?> _retryWithRefreshedToken(RequestOptions options) async {
    try {
      final newAccessToken = await _refreshAccessToken();
      if (newAccessToken == null) return null;
      options.headers['Authorization'] = 'Bearer $newAccessToken';
      return await _dio.fetch(options);
    } catch (_) {
      return null;
    }
  }

  // The backend revokes the old refresh token the moment it's used, so two 401s firing at
  // once (e.g. two screens loading in parallel right as the access token expires) must not
  // each call /auth/refresh independently — the second call would hit an already-revoked
  // token and wipe the session the first call just refreshed. Sharing one in-flight Future
  // makes every concurrent caller await the same result instead of racing.
  Future<String?>? _refreshInFlight;

  Future<String?> _refreshAccessToken() {
    return _refreshInFlight ??= _doRefreshAccessToken().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  Future<String?> _doRefreshAccessToken() async {
    final refreshToken = await _tokenStorage.refreshToken;
    if (refreshToken == null) return null;
    try {
      final response = await _refreshDio.post('/auth/refresh', data: {'refreshToken': refreshToken});
      final accessToken = response.data['accessToken'] as String;
      final newRefreshToken = response.data['refreshToken'] as String;
      final userId = response.data['userId'] as int;
      final role = response.data['role'] as String;
      await _tokenStorage.saveSession(
        accessToken: accessToken,
        refreshToken: newRefreshToken,
        userId: userId,
        role: role,
      );
      return accessToken;
    } catch (_) {
      await _tokenStorage.clear();
      return null;
    }
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) async {
    final response = await _guarded(() => _dio.get(path, queryParameters: query));
    return _asMap(response.data);
  }

  Future<List<dynamic>> getList(String path, {Map<String, dynamic>? query}) async {
    final response = await _guarded(() => _dio.get(path, queryParameters: query));
    return response.data is List ? response.data as List<dynamic> : <dynamic>[];
  }

  Future<Map<String, dynamic>> post(String path, {Object? data}) async {
    final response = await _guarded(() => _dio.post(path, data: data));
    return _asMap(response.data);
  }

  Future<Map<String, dynamic>> patch(String path, {Object? data}) async {
    final response = await _guarded(() => _dio.patch(path, data: data));
    return _asMap(response.data);
  }

  Future<void> delete(String path) async {
    await _guarded(() => _dio.delete(path));
  }

  Future<Map<String, dynamic>> postMultipart(String path, Future<FormData> Function() buildFormData) async {
    final response = await _guardedMultipart(path, buildFormData);
    return _asMap(response.data);
  }

  Future<List<dynamic>> postMultipartList(String path, Future<FormData> Function() buildFormData) async {
    final response = await _guardedMultipart(path, buildFormData);
    return response.data is List ? response.data as List<dynamic> : <dynamic>[];
  }

  /// A FormData body is a one-shot stream, so the interceptor's generic retry could not replay it:
  /// an avatar or job-image upload that happened to land on a just-expired access token failed
  /// outright instead of retrying. Callers hand over a builder rather than a built body, so the
  /// retry can construct a fresh one.
  Future<Response<dynamic>> _guardedMultipart(String path, Future<FormData> Function() buildFormData) async {
    final options = Options(extra: const {_skipInterceptorRetry: true});
    try {
      return await _dio.post(path, data: await buildFormData(), options: options);
    } on DioException catch (error) {
      if (error.response?.statusCode != 401 || path.startsWith('/auth/')) {
        throw _mapError(error);
      }
      final refreshed = await _refreshAccessToken();
      if (refreshed == null) {
        onSessionExpired?.call();
        throw _mapError(error);
      }
      try {
        return await _dio.post(path, data: await buildFormData(), options: options);
      } on DioException catch (retryError) {
        throw _mapError(retryError);
      }
    }
  }

  Map<String, dynamic> _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    return <String, dynamic>{};
  }

  Future<Response<dynamic>> _guarded(Future<Response<dynamic>> Function() call) async {
    try {
      return await call();
    } on DioException catch (e) {
      throw _mapError(e);
    }
  }

  ApiException _mapError(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'] as String? ?? "Noma'lum xatolik yuz berdi";
      final rawFieldErrors = data['fieldErrors'];
      Map<String, String>? fieldErrors;
      if (rawFieldErrors is Map) {
        fieldErrors = rawFieldErrors.map((k, v) => MapEntry(k.toString(), v.toString()));
      }
      return ApiException(
        message,
        statusCode: e.response?.statusCode,
        fieldErrors: fieldErrors,
        errorCode: data['errorCode'] as String?,
      );
    }
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.connectionError) {
      return ApiException("Internet aloqasi yo'q yoki server javob bermayapti", errorCode: 'NETWORK_ERROR');
    }
    return ApiException(
      "Serverda xatolik yuz berdi, birozdan keyin qayta urinib ko'ring",
      statusCode: e.response?.statusCode,
      errorCode: 'UNKNOWN_ERROR',
    );
  }
}
