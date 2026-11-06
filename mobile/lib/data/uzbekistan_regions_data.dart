import 'package:latlong2/latlong.dart';

class UzbekistanRegionGeo {
  final int id;
  final String name;
  final String shortName;
  final LatLng center;
  final double radiusKm;
  final double defaultZoom;

  const UzbekistanRegionGeo({
    required this.id,
    required this.name,
    required this.shortName,
    required this.center,
    required this.radiusKm,
    this.defaultZoom = 10.0,
  });
}

const List<UzbekistanRegionGeo> uzbekistanRegionsGeo = [
  UzbekistanRegionGeo(
    id: 14,
    name: 'Toshkent shahri',
    shortName: 'Toshkent sh.',
    center: LatLng(41.2995, 69.2401),
    radiusKm: 25.0,
    defaultZoom: 11.5,
  ),
  UzbekistanRegionGeo(
    id: 11,
    name: 'Toshkent viloyati',
    shortName: 'Toshkent vil.',
    center: LatLng(41.2414, 69.9547),
    radiusKm: 65.0,
    defaultZoom: 9.5,
  ),
  UzbekistanRegionGeo(
    id: 8,
    name: 'Samarqand viloyati',
    shortName: 'Samarqand',
    center: LatLng(39.9496, 66.3267),
    radiusKm: 60.0,
    defaultZoom: 9.5,
  ),
  UzbekistanRegionGeo(
    id: 2,
    name: 'Andijon viloyati',
    shortName: 'Andijon',
    center: LatLng(40.7308, 72.3217),
    radiusKm: 40.0,
    defaultZoom: 10.5,
  ),
  UzbekistanRegionGeo(
    id: 12,
    name: 'Farg‘ona viloyati',
    shortName: 'Farg‘ona',
    center: LatLng(40.3259, 71.2824),
    radiusKm: 50.0,
    defaultZoom: 10.0,
  ),
  UzbekistanRegionGeo(
    id: 7,
    name: 'Namangan viloyati',
    shortName: 'Namangan',
    center: LatLng(41.0810, 71.2988),
    radiusKm: 45.0,
    defaultZoom: 10.0,
  ),
  UzbekistanRegionGeo(
    id: 3,
    name: 'Buxoro viloyati',
    shortName: 'Buxoro',
    center: LatLng(40.2101, 63.7637),
    radiusKm: 80.0,
    defaultZoom: 9.0,
  ),
  UzbekistanRegionGeo(
    id: 13,
    name: 'Xorazm viloyati',
    shortName: 'Xorazm',
    center: LatLng(41.2733, 61.2492),
    radiusKm: 55.0,
    defaultZoom: 9.5,
  ),
  UzbekistanRegionGeo(
    id: 5,
    name: 'Qashqadaryo viloyati',
    shortName: 'Qashqadaryo',
    center: LatLng(38.7610, 66.0358),
    radiusKm: 75.0,
    defaultZoom: 9.0,
  ),
  UzbekistanRegionGeo(
    id: 9,
    name: 'Surxondaryo viloyati',
    shortName: 'Surxondaryo',
    center: LatLng(38.1086, 67.4632),
    radiusKm: 70.0,
    defaultZoom: 9.0,
  ),
  UzbekistanRegionGeo(
    id: 4,
    name: 'Jizzax viloyati',
    shortName: 'Jizzax',
    center: LatLng(40.3560, 67.8337),
    radiusKm: 60.0,
    defaultZoom: 9.5,
  ),
  UzbekistanRegionGeo(
    id: 10,
    name: 'Sirdaryo viloyati',
    shortName: 'Sirdaryo',
    center: LatLng(40.5986, 68.6314),
    radiusKm: 45.0,
    defaultZoom: 10.0,
  ),
  UzbekistanRegionGeo(
    id: 6,
    name: 'Navoiy viloyati',
    shortName: 'Navoiy',
    center: LatLng(41.5994, 64.2370),
    radiusKm: 120.0,
    defaultZoom: 8.5,
  ),
  UzbekistanRegionGeo(
    id: 1,
    name: 'Qoraqalpog‘iston Respublikasi',
    shortName: 'Qoraqalpog‘iston',
    center: LatLng(43.2856, 59.2410),
    radiusKm: 160.0,
    defaultZoom: 8.0,
  ),
];
