import 'enums.dart';

/// A worker's response to a job.
///
/// Two shapes come back from the server: the employer's shortlist carries the worker's details and
/// phone number, while the worker's own history leaves them out — they already know who they are.
class JobApplication {
  JobApplication({
    required this.id,
    required this.jobId,
    required this.jobTitle,
    required this.workerId,
    required this.status,
    required this.createdAt,
    this.workerProfileId,
    this.workerName,
    this.workerAvatarUrl,
    this.workerPhone,
    this.experienceYears,
    this.ratingAverage,
    this.ratingCount,
    this.verified = false,
    this.professions = const [],
  });

  final int id;
  final int jobId;
  final String jobTitle;
  final int workerId;
  final ApplicationStatus status;
  final DateTime createdAt;

  final int? workerProfileId;
  final String? workerName;
  final String? workerAvatarUrl;

  /// Present on the employer's shortlist: these workers asked to be called.
  final String? workerPhone;
  final int? experienceYears;
  final double? ratingAverage;
  final int? ratingCount;
  final bool verified;
  final List<String> professions;

  bool get hasRating => (ratingCount ?? 0) > 0;

  factory JobApplication.fromJson(Map<String, dynamic> json) => JobApplication(
        id: json['id'] as int,
        jobId: json['jobId'] as int,
        jobTitle: json['jobTitle'] as String? ?? '',
        workerId: json['workerId'] as int,
        status: ApplicationStatus.fromApi(json['status'] as String?) ?? ApplicationStatus.interested,
        createdAt: DateTime.parse(json['createdAt'] as String),
        workerProfileId: (json['workerProfileId'] as num?)?.toInt(),
        workerName: json['workerName'] as String?,
        workerAvatarUrl: json['workerAvatarUrl'] as String?,
        workerPhone: json['workerPhone'] as String?,
        experienceYears: (json['experienceYears'] as num?)?.toInt(),
        ratingAverage: (json['ratingAverage'] as num?)?.toDouble(),
        ratingCount: (json['ratingCount'] as num?)?.toInt(),
        verified: json['verified'] as bool? ?? false,
        professions: (json['professions'] as List<dynamic>? ?? []).map((e) => e as String).toList(),
      );
}
