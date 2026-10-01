import 'package:flutter/widgets.dart';

import 'enums.dart';

class JobImage {
  JobImage({required this.id, required this.url});

  final int id;
  final String url;

  factory JobImage.fromJson(Map<String, dynamic> json) => JobImage(
        id: json['id'] as int,
        url: json['url'] as String,
      );
}

class Job {
  Job({
    required this.id,
    required this.employerId,
    required this.employerName,
    this.employerAvatarUrl,
    required this.employerPhone,
    this.unlocked = true,
    required this.title,
    required this.description,
    required this.professionId,
    required this.professionName,
    required this.regionId,
    required this.regionName,
    required this.districtId,
    required this.districtName,
    required this.payment,
    required this.paymentType,
    required this.jobType,
    required this.workersNeeded,
    this.startDate,
    this.durationValue,
    this.durationUnit,
    required this.status,
    required this.createdAt,
    this.images = const [],
    this.latitude,
    this.longitude,
    this.urgent = false,
    this.applicationCount,
    this.myApplicationStatus,
    this.employerJobsPosted,
    this.employerJobsCompleted,
    this.employerRatingAverage,
    this.employerRatingCount,
  });

  final int id;
  final int employerId;
  final String employerName;
  final String? employerAvatarUrl;
  /// Null when this job is locked for the current (worker) viewer — the job-view
  /// fee is on and they haven't paid to unlock this job's contact details yet.
  final String? employerPhone;
  final bool unlocked;
  final String title;
  final String description;
  final int professionId;
  final String professionName;
  final int regionId;
  final String regionName;
  final int districtId;
  final String districtName;
  final num payment;
  final PaymentType paymentType;
  final JobType jobType;
  final int workersNeeded;
  final DateTime? startDate;
  final int? durationValue;
  final DurationUnit? durationUnit;
  final JobStatus status;
  final DateTime createdAt;
  final List<JobImage> images;
  final double? latitude;
  final double? longitude;

  /// "Bugunga kerak" — shown first in the list and badged on the card.
  final bool urgent;

  /// How many workers responded. Null where the server did not look it up.
  final int? applicationCount;

  /// This worker's own response, if any. Null for an employer, or when they have not responded.
  final ApplicationStatus? myApplicationStatus;

  /*
   * The employer's track record. Served only by the single-job endpoint, so these are null in a
   * list — working them out per row would cost a query per row.
   */
  final int? employerJobsPosted;
  final int? employerJobsCompleted;
  final double? employerRatingAverage;
  final int? employerRatingCount;

  bool get hasResponded => myApplicationStatus != null;

  String get location => '$regionName, $districtName';

  String? durationLabel(BuildContext context) =>
      durationValue == null || durationUnit == null ? null : '$durationValue ${durationUnit!.label(context)}';

  factory Job.fromJson(Map<String, dynamic> json) => Job(
        id: json['id'] as int,
        employerId: json['employerId'] as int,
        employerName: json['employerName'] as String,
        employerAvatarUrl: json['employerAvatarUrl'] as String?,
        employerPhone: json['employerPhone'] as String?,
        unlocked: json['unlocked'] as bool? ?? true,
        title: json['title'] as String,
        description: json['description'] as String,
        professionId: json['professionId'] as int,
        professionName: json['professionName'] as String,
        regionId: json['regionId'] as int,
        regionName: json['regionName'] as String,
        districtId: json['districtId'] as int,
        districtName: json['districtName'] as String,
        payment: json['payment'] as num,
        paymentType: PaymentType.fromApi(json['paymentType'] as String),
        jobType: JobType.fromApi(json['jobType'] as String),
        workersNeeded: json['workersNeeded'] as int? ?? 1,
        startDate: json['startDate'] == null ? null : DateTime.tryParse(json['startDate'] as String),
        durationValue: json['durationValue'] as int?,
        durationUnit:
            json['durationUnit'] == null ? null : DurationUnit.fromApi(json['durationUnit'] as String),
        status: JobStatus.fromApi(json['status'] as String),
        createdAt: DateTime.parse(json['createdAt'] as String),
        images: (json['images'] as List<dynamic>? ?? [])
            .map((e) => JobImage.fromJson(e as Map<String, dynamic>))
            .toList(),
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        urgent: json['urgent'] as bool? ?? false,
        applicationCount: (json['applicationCount'] as num?)?.toInt(),
        myApplicationStatus: ApplicationStatus.fromApi(json['myApplicationStatus'] as String?),
        employerJobsPosted: (json['employerJobsPosted'] as num?)?.toInt(),
        employerJobsCompleted: (json['employerJobsCompleted'] as num?)?.toInt(),
        employerRatingAverage: (json['employerRatingAverage'] as num?)?.toDouble(),
        employerRatingCount: (json['employerRatingCount'] as num?)?.toInt(),
      );
}
