import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:url_launcher/url_launcher.dart';

import '../../core/my_location.dart';
import '../../l10n/l10n_x.dart';
import 'map_tiles.dart';

/// The one map every screen uses: the configured tiles (cached, darkened in dark mode), the
/// user's position with its accuracy halo, the tile source's attribution, and a camera that stays
/// over Uzbekistan and does not rotate.
class AppMap extends ConsumerWidget {
  const AppMap({
    super.key,
    required this.controller,
    this.initialCenter = uzbekistanCenter,
    this.initialZoom = 6,
    this.initialFit,
    this.myLocation,
    this.layers = const [],
    this.onTap,
    this.onPositionChanged,
    this.onMapReady,
    this.attributionPadding = EdgeInsets.zero,
  });

  final MapController controller;
  final LatLng initialCenter;
  final double initialZoom;
  final CameraFit? initialFit;
  final UserLocation? myLocation;

  /// Drawn above the tiles and the user's position, in order.
  final List<Widget> layers;
  final void Function(TapPosition, LatLng)? onTap;
  final void Function(MapCamera camera, bool hasGesture)? onPositionChanged;
  final VoidCallback? onMapReady;

  /// Lifts the attribution above whatever panel the screen lays over the bottom of the map.
  final EdgeInsets attributionPadding;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tiles = ref.watch(mapTilesProvider);
    return FlutterMap(
      mapController: controller,
      options: MapOptions(
        initialCenter: initialCenter,
        initialZoom: initialZoom,
        initialCameraFit: initialFit,
        minZoom: 5,
        maxZoom: 19,
        cameraConstraint: CameraConstraint.containCenter(bounds: uzbekistanBounds),
        interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
        backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        onTap: onTap,
        onPositionChanged: onPositionChanged,
        onMapReady: onMapReady,
      ),
      children: [
        buildTileLayer(context, tiles),
        if (myLocation != null) ...myLocationLayers(myLocation!),
        ...layers,
        Padding(padding: attributionPadding, child: _Attribution(tiles: tiles)),
      ],
    );
  }
}

/// The blue dot, with a translucent circle as wide as the fix is uncertain.
List<Widget> myLocationLayers(UserLocation location) {
  const blue = Color(0xFF1A73E8);
  return [
    CircleLayer(circles: [
      CircleMarker(
        point: location.point,
        radius: location.accuracy.clamp(8, 2000).toDouble(),
        useRadiusInMeter: true,
        color: blue.withValues(alpha: 0.12),
        borderColor: blue.withValues(alpha: 0.35),
        borderStrokeWidth: 1,
      ),
    ]),
    MarkerLayer(markers: [
      Marker(
        point: location.point,
        width: 22,
        height: 22,
        child: Container(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: blue,
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 1))],
          ),
        ),
      ),
    ]),
  ];
}

class _Attribution extends StatelessWidget {
  const _Attribution({required this.tiles});

  final MapTiles tiles;

  @override
  Widget build(BuildContext context) {
    final url = tiles.attributionUrl;
    return Align(
      alignment: Alignment.bottomLeft,
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: GestureDetector(
          onTap: url == null ? null : () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.78),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              child: Text(
                '© ${tiles.attribution}',
                style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Zoom buttons and "my location", stacked on the right edge of a map.
class MapControls extends StatelessWidget {
  const MapControls({super.key, required this.controller, required this.onLocate, required this.locating});

  final MapController controller;
  final VoidCallback onLocate;
  final bool locating;

  void _zoom(double delta) {
    final camera = controller.camera;
    controller.move(camera.center, (camera.zoom + delta).clamp(5, 19).toDouble());
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final l10n = context.l10n;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Material(
          color: cs.surface,
          elevation: 3,
          shadowColor: Colors.black26,
          borderRadius: BorderRadius.circular(14),
          clipBehavior: Clip.antiAlias,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(tooltip: l10n.zoomInTooltip, icon: const Icon(Icons.add), onPressed: () => _zoom(1)),
              SizedBox(width: 28, child: Divider(height: 1, color: cs.outlineVariant)),
              IconButton(tooltip: l10n.zoomOutTooltip, icon: const Icon(Icons.remove), onPressed: () => _zoom(-1)),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Material(
          color: cs.surface,
          elevation: 3,
          shadowColor: Colors.black26,
          shape: const CircleBorder(),
          clipBehavior: Clip.antiAlias,
          child: IconButton(
            tooltip: l10n.myLocationTooltip,
            onPressed: locating ? null : onLocate,
            icon: locating
                ? SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary))
                : Icon(Icons.my_location, color: cs.primary),
          ),
        ),
      ],
    );
  }
}

/// "Search this area", shown at the top of a map once the user has moved it.
class SearchAreaButton extends StatelessWidget {
  const SearchAreaButton({super.key, required this.onPressed, required this.loading});

  final VoidCallback onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Material(
      color: cs.surface,
      elevation: 4,
      shadowColor: Colors.black26,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: loading ? null : onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              loading
                  ? SizedBox(height: 16, width: 16, child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary))
                  : Icon(Icons.refresh, size: 18, color: cs.primary),
              const SizedBox(width: 8),
              Text(context.l10n.searchThisAreaAction,
                  style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary, fontSize: 13.5)),
            ],
          ),
        ),
      ),
    );
  }
}

/// A rounded label pinned to the map with a small pointer under it: the price of a job.
class PriceMarker extends StatelessWidget {
  const PriceMarker({super.key, required this.label, this.selected = false, this.urgent = false});

  static const size = Size(96, 40);

  final String label;
  final bool selected;
  final bool urgent;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final accent = urgent ? cs.error : cs.primary;
    final background = selected ? accent : cs.surface;
    final foreground = selected ? (urgent ? cs.onError : cs.onPrimary) : accent;
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: accent, width: 1.5),
            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2))],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (urgent) ...[
                Icon(Icons.bolt_rounded, size: 13, color: foreground),
                const SizedBox(width: 1),
              ],
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: foreground, fontWeight: FontWeight.w800, fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        CustomPaint(size: const Size(12, 6), painter: _PointerPainter(accent)),
      ],
    );
  }
}

/// A round photo (or initials) pin, for people on the map.
class AvatarMarker extends StatelessWidget {
  const AvatarMarker({super.key, required this.child, this.selected = false, this.badgeColor});

  static const size = Size(52, 58);

  final Widget child;
  final bool selected;

  /// A small dot on the pin, e.g. green for a worker free today.
  final Color? badgeColor;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ring = selected ? cs.primary : cs.surface;
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: EdgeInsets.all(selected ? 3 : 2.5),
              decoration: BoxDecoration(
                color: ring,
                shape: BoxShape.circle,
                boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2))],
              ),
              child: child,
            ),
            if (badgeColor != null)
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: badgeColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: cs.surface, width: 2),
                  ),
                ),
              ),
          ],
        ),
        CustomPaint(size: const Size(12, 6), painter: _PointerPainter(ring)),
      ],
    );
  }
}

class _PointerPainter extends CustomPainter {
  _PointerPainter(this.color);

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width / 2, size.height)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(_PointerPainter old) => old.color != color;
}

/// The bubble for a group of nearby markers, sized by how many it holds.
class ClusterBubble extends StatelessWidget {
  const ClusterBubble({super.key, required this.count});

  final int count;

  static Size sizeFor(int count) => Size.square(count < 10 ? 40 : (count < 100 ? 46 : 54));

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: cs.primary.withValues(alpha: 0.22),
      ),
      padding: const EdgeInsets.all(4),
      child: Container(
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: cs.primary,
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6, offset: Offset(0, 2))],
        ),
        child: Text(
          count > 999 ? '999+' : '$count',
          style: TextStyle(color: cs.onPrimary, fontWeight: FontWeight.w800, fontSize: 13),
        ),
      ),
    );
  }
}

/// "150 ming", "1,2 mln": short enough to fit on a pin.
String compactPrice(BuildContext context, num value) {
  final l10n = context.l10n;
  final comma = Localizations.localeOf(context).languageCode != 'en';
  String trim(double v) {
    final s = v >= 10 ? v.round().toString() : v.toStringAsFixed(1).replaceFirst(RegExp(r'\.0$'), '');
    return comma ? s.replaceAll('.', ',') : s;
  }

  if (value >= 1000000) return l10n.priceMillions(trim(value / 1000000));
  if (value >= 1000) return l10n.priceThousands(trim(value / 1000));
  return value.round().toString();
}

/// The radius, in degrees, of a box that covers what the camera shows — what the map endpoints
/// take to return only what is on screen.
double visibleRadiusDegrees(MapCamera camera) {
  final b = camera.visibleBounds;
  final lat = (b.north - b.south) / 2;
  final lon = (b.east - b.west) / 2;
  return (lat > lon ? lat : lon) * 1.15;
}
