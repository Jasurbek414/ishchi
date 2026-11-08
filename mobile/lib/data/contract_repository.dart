import 'package:dio/dio.dart';

import '../core/api_client.dart';
import '../models/contract_status.dart';

class ContractRepository {
  ContractRepository(this._client);

  final ApiClient _client;

  Future<ContractStatus> getContractStatus() async {
    final res = await _client.get('/worker/contract');
    return ContractStatus.fromJson(res);
  }

  Future<ContractStatus> submitApplication({
    required String fullName,
    required String phone,
    required String category,
    String? passportData,
    int? experienceYears,
    String? description,
    String? telegramUsername,
    required bool agreedToTerms,
    String? passportPhotoPath,
    String? passportBackPath,
    String? certificatePath,
    String? toolsPhotoPath,
  }) async {
    final res = await _client.postMultipart('/worker/contract', () async {
      final map = <String, dynamic>{
        'fullName': fullName,
        'phone': phone,
        'category': category,
        'agreedToTerms': agreedToTerms,
      };

      if (passportData != null && passportData.isNotEmpty) {
        map['passportData'] = passportData;
      }
      if (experienceYears != null) {
        map['experienceYears'] = experienceYears;
      }
      if (description != null && description.isNotEmpty) {
        map['description'] = description;
      }
      if (telegramUsername != null && telegramUsername.isNotEmpty) {
        map['telegramUsername'] = telegramUsername;
      }

      if (passportPhotoPath != null && passportPhotoPath.isNotEmpty) {
        map['passportPhoto'] = await MultipartFile.fromFile(passportPhotoPath);
      }
      if (passportBackPath != null && passportBackPath.isNotEmpty) {
        map['passportBack'] = await MultipartFile.fromFile(passportBackPath);
      }
      if (certificatePath != null && certificatePath.isNotEmpty) {
        map['certificate'] = await MultipartFile.fromFile(certificatePath);
      }
      if (toolsPhotoPath != null && toolsPhotoPath.isNotEmpty) {
        map['toolsPhoto'] = await MultipartFile.fromFile(toolsPhotoPath);
      }

      return FormData.fromMap(map);
    });

    return ContractStatus.fromJson(res);
  }
}
