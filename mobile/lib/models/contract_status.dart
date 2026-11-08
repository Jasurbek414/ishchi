enum ContractApplicationStatus {
  none,
  pending,
  approved,
  rejected;

  static ContractApplicationStatus fromString(String? val) {
    if (val == null) return ContractApplicationStatus.none;
    switch (val.toUpperCase()) {
      case 'PENDING':
        return ContractApplicationStatus.pending;
      case 'APPROVED':
        return ContractApplicationStatus.approved;
      case 'REJECTED':
        return ContractApplicationStatus.rejected;
      default:
        return ContractApplicationStatus.none;
    }
  }
}

class ContractStatus {
  ContractStatus({
    required this.isEmergency,
    required this.applicationStatus,
    this.applicationId,
    this.category,
    this.phone,
    this.passportPhotoUrl,
    this.passportBackUrl,
    this.certificateUrl,
    this.toolsPhotoUrl,
    this.experienceYears,
    this.description,
    this.rejectionReason,
    this.submittedAt,
    this.reviewedAt,
    this.termsText,
  });

  final bool isEmergency;
  final ContractApplicationStatus applicationStatus;
  final int? applicationId;
  final String? category;
  final String? phone;
  final String? passportPhotoUrl;
  final String? passportBackUrl;
  final String? certificateUrl;
  final String? toolsPhotoUrl;
  final int? experienceYears;
  final String? description;
  final String? rejectionReason;
  final DateTime? submittedAt;
  final DateTime? reviewedAt;
  final String? termsText;

  factory ContractStatus.fromJson(Map<String, dynamic> json) {
    return ContractStatus(
      isEmergency: json['isEmergency'] as bool? ?? false,
      applicationStatus: ContractApplicationStatus.fromString(json['applicationStatus'] as String?),
      applicationId: json['applicationId'] as int?,
      category: json['category'] as String?,
      phone: json['phone'] as String?,
      passportPhotoUrl: json['passportPhotoUrl'] as String?,
      passportBackUrl: json['passportBackUrl'] as String?,
      certificateUrl: json['certificateUrl'] as String?,
      toolsPhotoUrl: json['toolsPhotoUrl'] as String?,
      experienceYears: json['experienceYears'] as int?,
      description: json['description'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      submittedAt: json['submittedAt'] != null ? DateTime.tryParse(json['submittedAt'] as String) : null,
      reviewedAt: json['reviewedAt'] != null ? DateTime.tryParse(json['reviewedAt'] as String) : null,
      termsText: json['termsText'] as String?,
    );
  }
}
