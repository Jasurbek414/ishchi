enum PromoRequestStatus {
  pending,
  approved,
  rejected,
  cancelled;

  static PromoRequestStatus fromApi(String? val) => switch (val?.toUpperCase()) {
        'APPROVED' => PromoRequestStatus.approved,
        'REJECTED' => PromoRequestStatus.rejected,
        'CANCELLED' => PromoRequestStatus.cancelled,
        _ => PromoRequestStatus.pending,
      };

  String get label => switch (this) {
        PromoRequestStatus.pending => 'Kutilmoqda',
        PromoRequestStatus.approved => 'Tasdiqlangan',
        PromoRequestStatus.rejected => 'Rad etilgan',
        PromoRequestStatus.cancelled => 'Bekor qilingan',
      };
}

class PromoRequestItem {
  final int id;
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final String? linkUrl;
  final String audience;
  final int? regionId;
  final String? regionName;
  final int durationDays;
  final PromoRequestStatus status;
  final String? rejectionReason;
  final double price;
  final bool paid;
  final int? promoBannerId;
  final DateTime createdAt;
  final DateTime? reviewedAt;

  const PromoRequestItem({
    required this.id,
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.linkUrl,
    required this.audience,
    this.regionId,
    this.regionName,
    required this.durationDays,
    required this.status,
    this.rejectionReason,
    required this.price,
    required this.paid,
    this.promoBannerId,
    required this.createdAt,
    this.reviewedAt,
  });

  factory PromoRequestItem.fromJson(Map<String, dynamic> json) {
    return PromoRequestItem(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String?,
      imageUrl: json['imageUrl'] as String?,
      linkUrl: json['linkUrl'] as String?,
      audience: json['audience'] as String? ?? 'ALL',
      regionId: json['regionId'] as int?,
      regionName: json['regionName'] as String?,
      durationDays: json['durationDays'] as int? ?? 7,
      status: PromoRequestStatus.fromApi(json['status'] as String?),
      rejectionReason: json['rejectionReason'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      paid: json['paid'] as bool? ?? true,
      promoBannerId: json['promoBannerId'] as int?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      reviewedAt: json['reviewedAt'] != null
          ? DateTime.tryParse(json['reviewedAt'].toString())
          : null,
    );
  }
}
