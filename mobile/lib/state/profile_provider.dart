import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/enums.dart';
import '../models/profile.dart';
import 'core_providers.dart';

class ProfileNotifier extends AsyncNotifier<Profile> {
  @override
  Future<Profile> build() {
    return ref.read(profileRepositoryProvider).getProfile();
  }

  Future<void> updateProfile({
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
    final updated = await ref.read(profileRepositoryProvider).updateProfile(
          firstName: firstName,
          lastName: lastName,
          regionId: regionId,
          districtId: districtId,
          about: about,
          experienceYears: experienceYears,
          available: available,
          professionIds: professionIds,
          latitude: latitude,
          longitude: longitude,
          workPreference: workPreference,
          hasDriverLicense: hasDriverLicense,
          driverLicenseCategories: driverLicenseCategories,
        );
    state = AsyncData(updated);
  }

  Future<void> uploadAvatar(String filePath) async {
    final updated = await ref.read(profileRepositoryProvider).uploadAvatar(filePath);
    state = AsyncData(updated);
  }

  Future<void> addExperience({
    required String companyName,
    required String positionTitle,
    String? description,
    required DateTime startDate,
    DateTime? endDate,
  }) async {
    final updated = await ref.read(profileRepositoryProvider).addExperience(
          companyName: companyName,
          positionTitle: positionTitle,
          description: description,
          startDate: startDate,
          endDate: endDate,
        );
    state = AsyncData(updated);
  }

  Future<void> updateExperience(
    int id, {
    required String companyName,
    required String positionTitle,
    String? description,
    required DateTime startDate,
    DateTime? endDate,
  }) async {
    final updated = await ref.read(profileRepositoryProvider).updateExperience(
          id,
          companyName: companyName,
          positionTitle: positionTitle,
          description: description,
          startDate: startDate,
          endDate: endDate,
        );
    state = AsyncData(updated);
  }

  Future<void> deleteExperience(int id) async {
    final updated = await ref.read(profileRepositoryProvider).deleteExperience(id);
    state = AsyncData(updated);
  }
}

final profileProvider = AsyncNotifierProvider<ProfileNotifier, Profile>(ProfileNotifier.new);
