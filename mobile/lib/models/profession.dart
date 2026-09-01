class Profession {
  Profession({required this.id, required this.name, required this.category, required this.active});

  final int id;
  final String name;
  final String category;
  final bool active;

  factory Profession.fromJson(Map<String, dynamic> json) => Profession(
        id: json['id'] as int,
        name: json['name'] as String,
        category: json['category'] as String,
        active: json['active'] as bool? ?? true,
      );
}
