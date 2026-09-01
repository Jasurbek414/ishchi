class ApiPromoBanner {
  ApiPromoBanner({
    required this.id,
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.linkUrl,
    required this.audience,
  });

  final int id;
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final String? linkUrl;
  final String audience;

  factory ApiPromoBanner.fromJson(Map<String, dynamic> json) => ApiPromoBanner(
        id: json['id'] as int,
        title: json['title'] as String,
        subtitle: json['subtitle'] as String?,
        imageUrl: json['imageUrl'] as String?,
        linkUrl: json['linkUrl'] as String?,
        audience: json['audience'] as String,
      );
}
