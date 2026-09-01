import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';

import '../core/my_location.dart';
import '../l10n/l10n_x.dart';

/// Full-screen map for picking a single point (job or worker location).
/// Returns the picked [LatLng] via `Navigator.pop`, or null if cancelled.
class LocationPickerScreen extends StatefulWidget {
  const LocationPickerScreen({super.key, this.initial});

  final LatLng? initial;

  @override
  State<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends State<LocationPickerScreen> {
  // Roughly the geographic center of Uzbekistan — sensible default when no point is picked yet.
  static const _uzbekistanCenter = LatLng(41.3775, 64.5853);

  late LatLng _picked;
  bool _locating = false;
  final _mapController = MapController();

  @override
  void initState() {
    super.initState();
    _picked = widget.initial ?? _uzbekistanCenter;
  }

  Future<void> _useCurrentLocation() async {
    setState(() => _locating = true);
    final point = await requestCurrentLocation(context);
    if (point != null) {
      setState(() => _picked = point);
      _mapController.move(point, 15);
    }
    if (mounted) setState(() => _locating = false);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.pickLocationOnMapTitle),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, _picked),
            style: TextButton.styleFrom(foregroundColor: cs.primary),
            child: Text(context.l10n.selectAction),
          ),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _picked,
              initialZoom: widget.initial != null ? 14 : 6,
              onTap: (_, point) => setState(() => _picked = point),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'uz.ecos.ishchi.app',
              ),
              MarkerLayer(markers: [
                Marker(
                  point: _picked,
                  width: 44,
                  height: 44,
                  alignment: Alignment.topCenter,
                  child: Icon(Icons.location_pin, color: cs.primary, size: 44),
                ),
              ]),
            ],
          ),
          Positioned(
            left: 12,
            right: 12,
            bottom: 12,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Text(
                  context.l10n.mapPickHint,
                  style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant),
                ),
              ),
            ),
          ),
          Positioned(
            right: 16,
            bottom: 76,
            child: FloatingActionButton(
              heroTag: 'locate-me',
              onPressed: _locating ? null : _useCurrentLocation,
              foregroundColor: cs.onPrimary,
              backgroundColor: cs.primary,
              child: _locating
                  ? SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: cs.onPrimary),
                    )
                  : const Icon(Icons.my_location),
            ),
          ),
        ],
      ),
    );
  }
}
