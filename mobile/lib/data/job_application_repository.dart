import '../core/api_client.dart';
import '../models/enums.dart';
import '../models/job_application.dart';
import '../models/page_response.dart';

class JobApplicationRepository {
  JobApplicationRepository(this._client);

  final ApiClient _client;

  /// "Javob berdim" — free, and idempotent: responding twice returns the existing response.
  Future<JobApplication> apply(int jobId) async {
    final res = await _client.post('/jobs/$jobId/apply');
    return JobApplication.fromJson(res);
  }

  Future<void> withdraw(int jobId) => _client.delete('/jobs/$jobId/apply');

  /// The employer's shortlist for one of their own jobs, contact details included.
  Future<List<JobApplication>> forJob(int jobId) async {
    final res = await _client.getList('/jobs/$jobId/applications');
    return res.map((e) => JobApplication.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<JobApplication> decide(int jobId, int workerUserId, ApplicationStatus status) async {
    final res = await _client.patch('/jobs/$jobId/applications/$workerUserId?status=${status.apiValue}');
    return JobApplication.fromJson(res);
  }

  Future<PageResponse<JobApplication>> mine({int page = 0, int size = 20}) async {
    final res = await _client.get('/my/applications', query: {'page': page, 'size': size});
    return PageResponse.fromJson(res, JobApplication.fromJson);
  }
}
