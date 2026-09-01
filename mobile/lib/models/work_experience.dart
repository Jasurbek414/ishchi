class WorkExperience {
  const WorkExperience({
    required this.id,
    required this.companyName,
    required this.positionTitle,
    this.description,
    required this.startDate,
    this.endDate,
  });

  final int id;
  final String companyName;
  final String positionTitle;
  final String? description;
  final DateTime startDate;
  final DateTime? endDate;

  bool get isCurrent => endDate == null;

  factory WorkExperience.fromJson(Map<String, dynamic> json) => WorkExperience(
        id: json['id'] as int,
        companyName: json['companyName'] as String,
        positionTitle: json['positionTitle'] as String,
        description: json['description'] as String?,
        startDate: DateTime.parse(json['startDate'] as String),
        endDate: json['endDate'] != null ? DateTime.parse(json['endDate'] as String) : null,
      );
}
