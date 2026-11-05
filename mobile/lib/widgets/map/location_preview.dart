import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/geo_repository.dart';
import '../../l10n/l10n_x.dart';
import '../../screens/location_picker_screen.dart';
import '../../state/core_providers.dart';
import 'map_tiles.dart';

/// The address at a point, looked up once per point and kept while the app runs.
final placeAtProvider = FutureProvider.family<GeoPlace?, LatLng>((ref, point) async {
  try {
    return await ref.watch(geoRepositoryProvider).reverse(point);
  } catch (_) {
    return null;
  }
});

/// A small map that cannot be moved, with a pin on [point]. Tapping it calls [onTap].
class LocationPreview extends ConsumerWidget {
  const LocationPreview({super.key, required this.point, this.height = 150, this.zoom = 15, this.onTap});

  final LatLng point;
  final double height;
  final double zoom;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final tiles = ref.watch(mapTilesProvider);
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: height,
        child: Stack(
          children: [
            FlutterMap(
              // A new point means a new camera, so the preview follows edits.
              key: ValueKey(point),
              options: MapOptions(
                initialCenter: point,
                initialZoom: zoom,
                interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                backgroundColor: cs.surfaceContainerHighest,
              ),
              children: [
                buildTileLayer(context, tiles),
                MarkerLayer(markers: [
                  Marker(
                    point: point,
                    width: 40,
                    height: 40,
                    alignment: Alignment.topCenter,
                    child: Icon(Icons.location_pin, color: cs.primary, size: 40,
                        shadows: const [Shadow(color: Colors.black38, blurRadius: 6, offset: Offset(0, 2))]),
                  ),
                ]),
              ],
            ),
            Positioned.fill(
              child: Material(
                type: MaterialType.transparency,
                child: InkWell(onTap: onTap),
              ),
            ),
            Positioned(
              left: 6,
              bottom: 4,
              child: Text('© ${tiles.attribution}',
                  style: TextStyle(fontSize: 9, color: cs.onSurfaceVariant.withValues(alpha: 0.8))),
            ),
          ],
        ),
      ),
    );
  }
}

/// The two-line address of [point], or a quiet placeholder while it loads or when unknown.
class PlaceText extends ConsumerWidget {
  const PlaceText({super.key, required this.point, this.fallback});

  final LatLng point;
  final String? fallback;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final place = ref.watch(placeAtProvider(point));
    final value = place.valueOrNull;
    final title = place.isLoading
        ? context.l10n.resolvingAddress
        : (value?.name ?? fallback ?? context.l10n.unnamedPlace);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontWeight: FontWeight.w600, color: place.isLoading ? cs.onSurfaceVariant : cs.onSurface)),
        if (value?.address != null)
          Text(value!.address!,
              maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant)),
      ],
    );
  }
}

/// A form field for an optional place on the map: a button while empty, then a map preview
/// with the address and a way to change or remove it.
class LocationField extends StatelessWidget {
  const LocationField({super.key, required this.label, required this.value, required this.onChanged});

  final String label;
  final LatLng? value;
  final ValueChanged<LatLng?> onChanged;

  Future<void> _pick(BuildContext context) async {
    final picked = await Navigator.of(context).push<LatLng>(
      MaterialPageRoute(builder: (_) => LocationPickerScreen(initial: value)),
    );
    if (picked != null) onChanged(picked);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final l10n = context.l10n;
    final point = value;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(label, style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        if (point == null)
          OutlinedButton.icon(
            onPressed: () => _pick(context),
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            icon: const Icon(Icons.add_location_alt_outlined),
            label: Text(l10n.pickOnMapAction),
          )
        else
          Card(
            margin: EdgeInsets.zero,
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LocationPreview(point: point, height: 130, onTap: () => _pick(context)),
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 10, 4, 10),
                  child: Row(
                    children: [
                      Icon(Icons.place_outlined, color: cs.primary),
                      const SizedBox(width: 10),
                      Expanded(child: PlaceText(point: point)),
                      IconButton(
                        tooltip: l10n.editAction,
                        icon: const Icon(Icons.edit_location_alt_outlined),
                        onPressed: () => _pick(context),
                      ),
                      IconButton(
                        tooltip: l10n.deleteAction,
                        icon: Icon(Icons.close, color: cs.onSurfaceVariant),
                        onPressed: () => onChanged(null),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// Hands the point to the phone's maps app for directions (Google Maps, Yandex, …), falling back
/// to Google Maps in the browser.
Future<void> openDirections(LatLng point, {String? label}) async {
  final lat = point.latitude.toStringAsFixed(6);
  final lon = point.longitude.toStringAsFixed(6);
  final name = label == null ? '' : '(${Uri.encodeComponent(label)})';
  final geo = Uri.parse('geo:$lat,$lon?q=$lat,$lon$name');
  if (await canLaunchUrl(geo) && await launchUrl(geo, mode: LaunchMode.externalApplication)) return;
  await launchUrl(
    Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lon'),
    mode: LaunchMode.externalApplication,
  );
}
