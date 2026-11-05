import 'package:latlong2/latlong.dart';

import '../core/api_client.dart';

/// A place from address search or reverse lookup: a bold first line and the area under it.
class GeoPlace {
  const GeoPlace({required this.name, this.address, required this.point});

  final String name;
  final String? address;
  final LatLng point;

  factory GeoPlace.fromJson(Map<String, dynamic> json) => GeoPlace(
        name: json['name'] as String,
        address: json['address'] as String?,
        point: LatLng((json['latitude'] as num).toDouble(), (json['longitude'] as num).toDouble()),
      );
}

class GeoRepository {
  GeoRepository(this._client);

  final ApiClient _client;

  Future<List<GeoPlace>> search(String query) async {
    final res = await _client.getList('/geo/search', query: {'q': query});
    return res.map((e) => GeoPlace.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Null when nothing is known about the point.
  Future<GeoPlace?> reverse(LatLng point) async {
    final res = await _client.get('/geo/reverse', query: {'lat': point.latitude, 'lon': point.longitude});
    if (res['name'] == null) return null;
    return GeoPlace.fromJson(res);
  }
}
