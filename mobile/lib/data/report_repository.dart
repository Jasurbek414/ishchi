import '../core/api_client.dart';
import '../models/enums.dart';

class ReportRepository {
  ReportRepository(this._client);

  final ApiClient _client;

  /// Report a posting or a person. Exactly one target; the server rejects both or neither.
  Future<void> submit({
    int? jobId,
    int? reportedUserId,
    required ReportReason reason,
    String? details,
  }) async {
    await _client.post('/reports', data: {
      if (jobId != null) 'jobId': jobId,
      if (reportedUserId != null) 'reportedUserId': reportedUserId,
      'reason': reason.apiValue,
      if (details != null && details.trim().isNotEmpty) 'details': details.trim(),
    });
  }
}
