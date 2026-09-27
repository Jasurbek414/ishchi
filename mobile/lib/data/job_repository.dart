import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../models/enums.dart';
import '../models/job.dart';
import '../models/page_response.dart';

class JobRepository {
  JobRepository(this._client);

  final ApiClient _client;

  Future<PageResponse<Job>> search({
    int? regionId,
    int? districtId,
    int? professionId,
    JobType? jobType,
    num? minPayment,
    num? maxPayment,
    JobStatus? status,
    String? search,
    String sort = 'newest',
    int? nearRegionId,
    int? nearDistrictId,
    int page = 0,
    int size = 20,
  }) async {
    final res = await _client.get('/jobs', query: {
      if (regionId != null) 'regionId': regionId,
      if (districtId != null) 'districtId': districtId,
      if (professionId != null) 'professionId': professionId,
      if (jobType != null) 'jobType': jobType.apiValue,
      if (minPayment != null) 'minPayment': minPayment,
      if (maxPayment != null) 'maxPayment': maxPayment,
      if (status != null) 'status': status.apiValue,
      if (search != null && search.isNotEmpty) 'search': search,
      'sortBy': sort,
      if (nearRegionId != null) 'nearRegionId': nearRegionId,
      if (nearDistrictId != null) 'nearDistrictId': nearDistrictId,
      'page': page,
      'size': size,
    });
    return PageResponse.fromJson(res, Job.fromJson);
  }

  Future<List<Job>> mapSearch({int? regionId, int? professionId}) async {
    final res = await _client.getList('/jobs/map', query: {
      if (regionId != null) 'regionId': regionId,
      if (professionId != null) 'professionId': professionId,
    });
    return res.map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<PageResponse<Job>> myJobs({JobStatus? status, int page = 0, int size = 20}) async {
    final res = await _client.get('/jobs/my', query: {
      if (status != null) 'status': status.apiValue,
      'page': page,
      'size': size,
    });
    return PageResponse.fromJson(res, Job.fromJson);
  }

  Future<Job> getById(int id) async {
    final res = await _client.get('/jobs/$id');
    return Job.fromJson(res);
  }

  /// Worker-only: pays the configured job-view fee (once per job) to reveal the
  /// employer's phone number. Throws [ApiException] with `INSUFFICIENT_BALANCE`
  /// when the wallet can't cover it.
  Future<Job> unlock(int id) async {
    final res = await _client.post('/jobs/$id/unlock');
    return Job.fromJson(res);
  }

  Future<Job> create({
    required String title,
    required String description,
    required int professionId,
    required int regionId,
    required int districtId,
    required num payment,
    required PaymentType paymentType,
    required JobType jobType,
    int workersNeeded = 1,
    DateTime? startDate,
    int? durationValue,
    DurationUnit? durationUnit,
    double? latitude,
    double? longitude,
  }) async {
    final res = await _client.post('/jobs', data: {
      'title': title,
      'description': description,
      'professionId': professionId,
      'regionId': regionId,
      'districtId': districtId,
      'payment': payment,
      'paymentType': paymentType.apiValue,
      'jobType': jobType.apiValue,
      'workersNeeded': workersNeeded,
      if (startDate != null) 'startDate': _formatDate(startDate),
      if (durationValue != null) 'durationValue': durationValue,
      if (durationUnit != null) 'durationUnit': durationUnit.apiValue,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    });
    return Job.fromJson(res);
  }

  Future<Job> update(
    int id, {
    String? title,
    String? description,
    int? professionId,
    int? regionId,
    int? districtId,
    num? payment,
    PaymentType? paymentType,
    JobType? jobType,
    int? workersNeeded,
    DateTime? startDate,
    int? durationValue,
    DurationUnit? durationUnit,
    double? latitude,
    double? longitude,
  }) async {
    final res = await _client.patch('/jobs/$id', data: {
      if (title != null) 'title': title,
      if (description != null) 'description': description,
      if (professionId != null) 'professionId': professionId,
      if (regionId != null) 'regionId': regionId,
      if (districtId != null) 'districtId': districtId,
      if (payment != null) 'payment': payment,
      if (paymentType != null) 'paymentType': paymentType.apiValue,
      if (jobType != null) 'jobType': jobType.apiValue,
      if (workersNeeded != null) 'workersNeeded': workersNeeded,
      if (startDate != null) 'startDate': _formatDate(startDate),
      if (durationValue != null) 'durationValue': durationValue,
      if (durationUnit != null) 'durationUnit': durationUnit.apiValue,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    });
    return Job.fromJson(res);
  }

  Future<Job> changeStatus(int id, JobStatus status) async {
    final res = await _client.patch('/jobs/$id/status', data: {'status': status.apiValue});
    return Job.fromJson(res);
  }

  Future<void> delete(int id) => _client.delete('/jobs/$id');

  Future<List<JobImage>> uploadImages(int jobId, List<String> filePaths) async {
    // Built on demand so a retry after a token refresh gets fresh file streams.
    final res = await _client.postMultipartList('/jobs/$jobId/images', () async => FormData.fromMap({
          'files': [for (final path in filePaths) await MultipartFile.fromFile(path)],
        }));
    return res.map((e) => JobImage.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> deleteImage(int jobId, int imageId) => _client.delete('/jobs/$jobId/images/$imageId');

  String _formatDate(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}
