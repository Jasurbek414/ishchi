import 'enums.dart';

/// A filter the worker asked to be told about, instead of hearing about everything in their trade.
class SavedSearch {
  SavedSearch({
    required this.id,
    required this.name,
    required this.notifyEnabled,
    this.professionId,
    this.professionName,
    this.regionId,
    this.regionName,
    this.districtId,
    this.districtName,
    this.jobType,
    this.minPayment,
  });

  final int id;
  final String name;
  final bool notifyEnabled;
  final int? professionId;
  final String? professionName;
  final int? regionId;
  final String? regionName;
  final int? districtId;
  final String? districtName;
  final JobType? jobType;
  final num? minPayment;

  factory SavedSearch.fromJson(Map<String, dynamic> json) => SavedSearch(
        id: json['id'] as int,
        name: json['name'] as String,
        notifyEnabled: json['notifyEnabled'] as bool? ?? true,
        professionId: (json['professionId'] as num?)?.toInt(),
        professionName: json['professionName'] as String?,
        regionId: (json['regionId'] as num?)?.toInt(),
        regionName: json['regionName'] as String?,
        districtId: (json['districtId'] as num?)?.toInt(),
        districtName: json['districtName'] as String?,
        jobType: json['jobType'] == null ? null : JobType.fromApi(json['jobType'] as String),
        minPayment: json['minPayment'] as num?,
      );
}
