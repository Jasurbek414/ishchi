class Region {
  Region({required this.id, required this.name});

  final int id;
  final String name;

  factory Region.fromJson(Map<String, dynamic> json) =>
      Region(id: json['id'] as int, name: json['name'] as String);
}

class District {
  District({required this.id, required this.name, required this.regionId});

  final int id;
  final String name;
  final int regionId;

  factory District.fromJson(Map<String, dynamic> json) => District(
        id: json['id'] as int,
        name: json['name'] as String,
        regionId: json['regionId'] as int,
      );
}
