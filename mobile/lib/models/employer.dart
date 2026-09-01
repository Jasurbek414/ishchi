class Employer {
  Employer({
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
    this.about,
    this.latitude,
    this.longitude,
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
  final String? about;
  final double? latitude;
  final double? longitude;

  String get fullName => '$firstName $lastName';

  factory Employer.fromJson(Map<String, dynamic> json) => Employer(
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
        about: json['about'] as String?,
        latitude: (json['latitude'] as num?)?.toDouble(),
        longitude: (json['longitude'] as num?)?.toDouble(),
      );
}
