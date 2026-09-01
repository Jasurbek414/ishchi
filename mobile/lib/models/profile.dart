import 'enums.dart';
import 'profession.dart';
import 'work_experience.dart';

class Profile {
  Profile({
    required this.userId,
    required this.phone,
    required this.role,
    required this.firstName,
    required this.lastName,
    this.avatarUrl,
    required this.regionId,
    required this.regionName,
    required this.districtId,
    required this.districtName,
    this.about,
    this.experienceYears,
    this.available,
    required this.professions,
    this.latitude,
    this.longitude,
    this.workPreference,
    this.hasDriverLicense = false,
    this.driverLicenseCategories,
    this.experiences = const [],
  });

  final int userId;
  final String phone;
  final UserRole role;
  final String firstName;
  final String lastName;
  final String? avatarUrl;
  final int regionId;
  final String regionName;
  final int districtId;
  final String districtName;
  final String? about;
  final int? experienceYears;
  final bool? available;
  final List<Profession> professions;
  final double? latitude;
  final double? longitude;
  final WorkPreference? workPreference;
  final bool hasDriverLicense;
  final String? driverLicenseCategories;
  final List<WorkExperience> experiences;

  String get fullName => '$firstName $lastName';

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
        userId: json['userId'] as int,
        phone: json['phone'] as String,
        role: UserRole.fromApi(json['role'] as String),
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        avatarUrl: json['avatarUrl'] as String?,
        regionId: json['regionId'] as int,
        regionName: json['regionName'] as String,
        districtId: json['districtId'] as int,
        districtName: json['districtName'] as String,
        about: json['about'] as String?,
        experienceYears: json['experienceYears'] as int?,
        available: json['available'] as bool?,
        professions: (json['professions'] as List<dynamic>? ?? [])
            .map((e) => Profession.fromJson(e as Map<String, dynamic>))
            .toList(),
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
        workPreference: WorkPreference.fromApi(json['workPreference'] as String?),
        hasDriverLicense: json['hasDriverLicense'] as bool? ?? false,
        driverLicenseCategories: json['driverLicenseCategories'] as String?,
        experiences: (json['experiences'] as List<dynamic>? ?? [])
            .map((e) => WorkExperience.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
