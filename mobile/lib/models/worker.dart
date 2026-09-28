import 'enums.dart';
import 'profession.dart';
import 'work_experience.dart';

class Worker {
  Worker({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    required this.phone,
    required this.regionId,
    required this.regionName,
    required this.districtId,
    required this.districtName,
    this.experienceYears,
    this.about,
    required this.available,
    required this.professions,
    this.latitude,
    this.longitude,
    this.workPreference,
    this.hasDriverLicense = false,
    this.driverLicenseCategories,
    this.experiences = const [],
    this.availableUntil,
    this.ratingAverage,
    this.ratingCount = 0,
    this.verified = false,
  });

  final int id;
  final int userId;
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final String phone;
  final int regionId;
  final String regionName;
  final int districtId;
  final String districtName;
  final int? experienceYears;
  final String? about;
  final bool available;
  final List<Profession> professions;
  final double? latitude;
  final double? longitude;
  final WorkPreference? workPreference;
  final bool hasDriverLicense;
  final String? driverLicenseCategories;
  final List<WorkExperience> experiences;

  /// Set when the worker said they can work today; a past value means the day has rolled over.
  final DateTime? availableUntil;
  final double? ratingAverage;
  final int ratingCount;

  /// Documents checked by an admin — the one signal the platform itself vouches for.
  final bool verified;

  /// True only while the "I can work today" window is still open.
  bool get availableToday => availableUntil != null && availableUntil!.isAfter(DateTime.now());

  String get fullName => '$firstName $lastName';

  factory Worker.fromJson(Map<String, dynamic> json) => Worker(
        id: json['id'] as int,
        userId: json['userId'] as int,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        avatarUrl: json['avatarUrl'] as String?,
        phone: json['phone'] as String,
        regionId: json['regionId'] as int,
        regionName: json['regionName'] as String,
        districtId: json['districtId'] as int,
        districtName: json['districtName'] as String,
        experienceYears: json['experienceYears'] as int?,
        about: json['about'] as String?,
        available: json['available'] as bool? ?? true,
        professions: (json['professions'] as List<dynamic>? ?? [])
            .map((e) => Profession.fromJson(e as Map<String, dynamic>))
            .toList(),
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        workPreference: WorkPreference.fromApi(json['workPreference'] as String?),
        hasDriverLicense: json['hasDriverLicense'] as bool? ?? false,
        driverLicenseCategories: json['driverLicenseCategories'] as String?,
        availableUntil: json['availableUntil'] == null
            ? null
            : DateTime.tryParse(json['availableUntil'] as String),
        ratingAverage: (json['ratingAverage'] as num?)?.toDouble(),
        ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
        verified: json['verified'] as bool? ?? false,
        experiences: (json['experiences'] as List<dynamic>? ?? [])
            .map((e) => WorkExperience.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
