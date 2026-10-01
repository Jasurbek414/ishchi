import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../../state/app_settings_provider.dart';

/// Roughly the geographic centre of Uzbekistan, for maps that have nothing better to show.
const uzbekistanCenter = LatLng(41.3775, 64.5853);

/// A box around Uzbekistan with some margin. The camera's centre is kept inside it, so a stray
/// fling cannot leave the user looking at the ocean.
final uzbekistanBounds = LatLngBounds(const LatLng(35.5, 54.0), const LatLng(46.5, 75.5));

const _defaultTileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const _defaultAttribution = 'OpenStreetMap';
const _defaultAttributionUrl = 'https://www.openstreetmap.org/copyright';

/// Which tiles the maps draw: the admin's choice from app settings, else OpenStreetMap.
class MapTiles {
  const MapTiles({required this.urlTemplate, required this.attribution, this.attributionUrl, required this.isDefault});

  final String urlTemplate;
  final String attribution;
  final String? attributionUrl;

  /// The built-in tiles have no dark variant, so they are darkened in dark mode instead.
  final bool isDefault;
}

final mapTilesProvider = Provider<MapTiles>((ref) {
  final settings = ref.watch(appSettingsProvider).valueOrNull;
  final custom = settings?.mapTileUrl?.trim();
  if (custom == null || custom.isEmpty) {
    return const MapTiles(
      urlTemplate: _defaultTileUrl,
      attribution: _defaultAttribution,
      attributionUrl: _defaultAttributionUrl,
      isDefault: true,
    );
  }
  final attribution = settings?.mapAttribution?.trim();
  return MapTiles(
    urlTemplate: custom,
    attribution: attribution == null || attribution.isEmpty ? _defaultAttribution : attribution,
    isDefault: false,
  );
});

/// Keeps downloaded tiles on the phone, so a map opened again draws at once, works on a weak
/// connection and asks the tile server for far less.
class CachedTileProvider extends TileProvider {
  CachedTileProvider();

  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) =>
      CachedNetworkImageProvider(getTileUrl(coordinates, options), headers: headers);
}

TileLayer buildTileLayer(BuildContext context, MapTiles tiles) {
  final dark = Theme.of(context).brightness == Brightness.dark;
  return TileLayer(
    urlTemplate: tiles.urlTemplate,
    userAgentPackageName: 'uz.ecos.ishchi.app',
    tileProvider: CachedTileProvider(),
    maxNativeZoom: 19,
    keepBuffer: 3,
    panBuffer: 1,
    tileBuilder: dark && tiles.isDefault ? darkModeTileBuilder : null,
  );
}
