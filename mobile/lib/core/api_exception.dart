class ApiException implements Exception {
  ApiException(this.message, {this.statusCode, this.fieldErrors, this.errorCode});

  final String message;
  final int? statusCode;
  final Map<String, String>? fieldErrors;
  /// Machine-readable failure type from the backend (e.g. `ACCOUNT_BLOCKED`,
  /// `ACCOUNT_NOT_VERIFIED`, `INVALID_CREDENTIALS`), when the backend sends one.
  /// Null for validation errors, network failures, or unclassified server errors.
  final String? errorCode;

  @override
  String toString() => message;
}
