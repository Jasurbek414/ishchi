import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../core/my_location.dart';
import '../data/geo_repository.dart';
import '../l10n/l10n_x.dart';
import '../state/core_providers.dart';
import '../widgets/map/app_map.dart';
import '../widgets/map/map_tiles.dart';

/// Full-screen map for picking a single point (job or worker location): the user moves the map
/// under a fixed pin, sees the address it lands on, or searches for one.
/// Returns the picked [LatLng] via `Navigator.pop`, or null if cancelled.
class LocationPickerScreen extends ConsumerStatefulWidget {
  const LocationPickerScreen({super.key, this.initial});

  final LatLng? initial;

  @override
  ConsumerState<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends ConsumerState<LocationPickerScreen> {
  final _mapController = MapController();
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();

  late LatLng _center = widget.initial ?? uzbekistanCenter;
  UserLocation? _me;
  bool _locating = false;
  bool _moving = false;
  bool _ready = false;

  GeoPlace? _place;
  bool _resolving = false;
  bool _resolvedOnce = false;
  int _resolveGeneration = 0;
  Timer? _idle;

  List<GeoPlace>? _results;
  bool _searching = false;
  Timer? _searchDebounce;
  int _searchGeneration = 0;

  GeoRepository get _geo => ref.read(geoRepositoryProvider);

  @override
  void initState() {
    super.initState();
    if (widget.initial != null) {
      _resolve(widget.initial!);
    } else {
      // Start where the user is when the phone already allows it; otherwise the whole country,
      // with the location button one tap away.
      quietUserLocation().then((me) {
        if (!mounted || me == null) return;
        setState(() => _me = me);
        if (_ready) _mapController.move(me.point, 16);
      });
    }
  }

  @override
  void dispose() {
    _idle?.cancel();
    _searchDebounce?.cancel();
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _onPositionChanged(MapCamera camera, bool hasGesture) {
    _center = camera.center;
    if (!_moving) setState(() => _moving = true);
    _idle?.cancel();
    _idle = Timer(const Duration(milliseconds: 450), () {
      if (!mounted) return;
      setState(() => _moving = false);
      HapticFeedback.selectionClick();
      _resolve(_center);
    });
  }

  Future<void> _resolve(LatLng point) async {
    final generation = ++_resolveGeneration;
    setState(() => _resolving = true);
    GeoPlace? place;
    try {
      place = await _geo.reverse(point);
    } catch (_) {
      place = null;
    }
    if (!mounted || generation != _resolveGeneration) return;
    setState(() {
      _place = place;
      _resolving = false;
      _resolvedOnce = true;
    });
  }

  void _onSearchChanged(String text) {
    _searchDebounce?.cancel();
    final q = text.trim();
    if (q.length < 3) {
      setState(() {
        _results = null;
        _searching = false;
      });
      return;
    }
    _searchDebounce = Timer(const Duration(milliseconds: 700), () => _search(q));
  }

  Future<void> _search(String q) async {
    final generation = ++_searchGeneration;
    setState(() => _searching = true);
    List<GeoPlace> results;
    try {
      results = await _geo.search(q);
    } catch (_) {
      results = const [];
    }
    if (!mounted || generation != _searchGeneration) return;
    setState(() {
      _results = results;
      _searching = false;
    });
  }

  void _pickResult(GeoPlace place) {
    _searchFocus.unfocus();
    _searchDebounce?.cancel();
    setState(() {
      _results = null;
      _searchController.text = place.name;
    });
    _mapController.move(place.point, 17);
    // The move resolves the address again; show the chosen one meanwhile.
    setState(() {
      _place = place;
      _resolvedOnce = true;
    });
  }

  Future<void> _locate() async {
    setState(() => _locating = true);
    final me = await requestUserLocation(context);
    if (!mounted) return;
    setState(() {
      _locating = false;
      if (me != null) _me = me;
    });
    if (me != null) _mapController.move(me.point, 17);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final l10n = context.l10n;
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.pickLocationOnMapTitle)),
      body: Stack(
        children: [
          AppMap(
            controller: _mapController,
            initialCenter: _center,
            initialZoom: widget.initial != null ? 16 : 6,
            myLocation: _me,
            onMapReady: () {
              _ready = true;
              if (widget.initial == null && _me != null) _mapController.move(_me!.point, 16);
            },
            onTap: (_, point) {
              _searchFocus.unfocus();
              _mapController.move(point, _mapController.camera.zoom < 15 ? 16 : _mapController.camera.zoom);
            },
            onPositionChanged: _onPositionChanged,
          ),

          // The pin stays in the middle; it lifts while the map moves under it.
          IgnorePointer(
            child: Center(
              child: Transform.translate(
                offset: const Offset(0, -22),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    AnimatedSlide(
                      duration: const Duration(milliseconds: 160),
                      offset: Offset(0, _moving ? -0.22 : 0),
                      child: Icon(Icons.location_pin, color: cs.primary, size: 48,
                          shadows: const [Shadow(color: Colors.black38, blurRadius: 8, offset: Offset(0, 3))]),
                    ),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      width: _moving ? 14 : 8,
                      height: _moving ? 5 : 4,
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: _moving ? 0.18 : 0.32),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Address search.
          Positioned(
            left: 12,
            right: 12,
            top: 12,
            child: Column(
              children: [
                Material(
                  elevation: 4,
                  shadowColor: Colors.black26,
                  borderRadius: BorderRadius.circular(16),
                  color: cs.surface,
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocus,
                    textInputAction: TextInputAction.search,
                    onChanged: _onSearchChanged,
                    onSubmitted: (v) {
                      if (v.trim().length >= 2) _search(v.trim());
                    },
                    decoration: InputDecoration(
                      hintText: l10n.searchAddressHint,
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searching
                          ? const Padding(
                              padding: EdgeInsets.all(14),
                              child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                            )
                          : (_searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _results = null);
                                  },
                                )
                              : null),
                      filled: false,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
                if (_results != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Material(
                      elevation: 4,
                      shadowColor: Colors.black26,
                      borderRadius: BorderRadius.circular(16),
                      color: cs.surface,
                      clipBehavior: Clip.antiAlias,
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 280),
                        child: _results!.isEmpty
                            ? Padding(
                                padding: const EdgeInsets.all(16),
                                child: Row(children: [
                                  Icon(Icons.search_off, color: cs.onSurfaceVariant),
                                  const SizedBox(width: 10),
                                  Text(l10n.noAddressResults, style: TextStyle(color: cs.onSurfaceVariant)),
                                ]),
                              )
                            : ListView.separated(
                                shrinkWrap: true,
                                padding: EdgeInsets.zero,
                                itemCount: _results!.length,
                                separatorBuilder: (_, __) => Divider(height: 1, color: cs.outlineVariant),
                                itemBuilder: (context, i) {
                                  final r = _results![i];
                                  return ListTile(
                                    leading: Icon(Icons.place_outlined, color: cs.primary),
                                    title: Text(r.name, maxLines: 1, overflow: TextOverflow.ellipsis),
                                    subtitle: r.address == null
                                        ? null
                                        : Text(r.address!, maxLines: 1, overflow: TextOverflow.ellipsis),
                                    onTap: () => _pickResult(r),
                                  );
                                },
                              ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          Positioned(
            right: 12,
            bottom: 196 + bottomInset,
            child: MapControls(controller: _mapController, onLocate: _locate, locating: _locating),
          ),

          // What is under the pin, and the button that takes it.
          Positioned(
            left: 12,
            right: 12,
            bottom: 28 + bottomInset,
            child: Card(
              margin: EdgeInsets.zero,
              elevation: 6,
              shadowColor: Colors.black38,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.12), shape: BoxShape.circle),
                          child: Icon(Icons.place, color: cs.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: _AddressLines(place: _place, busy: _moving || _resolving, untouched: !_resolvedOnce)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(l10n.mapDragHint, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 10),
                    FilledButton.icon(
                      onPressed: _moving ? null : () => Navigator.pop(context, _center),
                      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                      icon: const Icon(Icons.check),
                      label: Text(l10n.confirmLocationAction),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AddressLines extends StatelessWidget {
  const _AddressLines({required this.place, required this.busy, required this.untouched});

  final GeoPlace? place;
  final bool busy;

  /// Nothing has been looked up yet: the map has not been moved to a place.
  final bool untouched;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final l10n = context.l10n;
    final title = busy
        ? l10n.resolvingAddress
        : (place?.name ?? (untouched ? l10n.pickLocationOnMapTitle : l10n.unnamedPlace));
    final subtitle = busy ? null : place?.address;
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 150),
      layoutBuilder: (current, previous) => Stack(
        alignment: Alignment.centerLeft,
        children: [...previous, if (current != null) current],
      ),
      child: Column(
        key: ValueKey('$title|$subtitle'),
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 15,
              color: busy ? cs.onSurfaceVariant : cs.onSurface,
            ),
          ),
          if (subtitle != null)
            Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant)),
        ],
      ),
    );
  }
}
