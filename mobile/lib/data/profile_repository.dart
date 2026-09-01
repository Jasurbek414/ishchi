import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../models/enums.dart';
import '../models/profile.dart';

class ProfileRepository {
  ProfileRepository(this._client);

  final ApiClient _client;

  Future<Profile> getProfile() async {
    final res = await _client.get('/profile');
    return Profile.fromJson(res);
  }

  Future<Profile> updateProfile({
    String? firstName,
    String? lastName,
    int? regionId,
    int? districtId,
    String? about,
    int? experienceYears,
    bool? available,
    List<int>? professionIds,
    double? latitude,
    double? longitude,
    WorkPreference? workPreference,
    bool? hasDriverLicense,
    String? driverLicenseCategories,
  }) async {
    final body = <String, dynamic>{
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
      if (regionId != null) 'regionId': regionId,
      if (districtId != null) 'districtId': districtId,
      if (about != null) 'about': about,
      if (experienceYears != null) 'experienceYears': experienceYears,
      if (available != null) 'available': available,
      if (professionIds != null) 'professionIds': professionIds,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (workPreference != null) 'workPreference': workPreference.apiValue,
      if (hasDriverLicense != null) 'hasDriverLicense': hasDriverLicense,
      if (driverLicenseCategories != null) 'driverLicenseCategories': driverLicenseCategories,
    };
    final res = await _client.patch('/profile', data: body);
    return Profile.fromJson(res);
  }

  Future<Profile> uploadAvatar(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
    });
    final res = await _client.postMultipart('/profile/avatar', formData);
    return Profile.fromJson(res);
  }

  Future<Profile> addExperience({
    required String companyName,
    required String positionTitle,
    String? description,
    required DateTime startDate,
    DateTime? endDate,
  }) async {
    final res = await _client.post('/profile/experience', data: _experienceBody(
      companyName: companyName,
      positionTitle: positionTitle,
      description: description,
      startDate: startDate,
      endDate: endDate,
    ));
    return Profile.fromJson(res);
  }

  Future<Profile> updateExperience(
    int id, {
    required String companyName,
    required String positionTitle,
    String? description,
    required DateTime startDate,
    DateTime? endDate,
  }) async {
    final res = await _client.patch('/profile/experience/$id', data: _experienceBody(
      companyName: companyName,
      positionTitle: positionTitle,
      description: description,
      startDate: startDate,
      endDate: endDate,
    ));
    return Profile.fromJson(res);
  }

  Future<Profile> deleteExperience(int id) async {
    await _client.delete('/profile/experience/$id');
    return getProfile();
  }

  Map<String, dynamic> _experienceBody({
    required String companyName,
    required String positionTitle,
    String? description,
    required DateTime startDate,
    DateTime? endDate,
  }) {
    String fmt(DateTime d) =>
        '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
    return {
      'companyName': companyName,
      'positionTitle': positionTitle,
      if (description != null && description.isNotEmpty) 'description': description,
      'startDate': fmt(startDate),
      if (endDate != null) 'endDate': fmt(endDate),
    };
  }
}
