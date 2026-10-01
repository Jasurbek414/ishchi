import 'dart:math' show Point;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart';
import 'package:latlong2/latlong.dart';

import '../../core/api_exception.dart';
import '../../core/my_location.dart';
import '../../l10n/l10n_x.dart';
import 'app_map.dart';
import 'map_tiles.dart';

/// What the map asks the server for: the filters, and the visible area once the user has moved.
class MapQuery {
  const MapQuery({this.center, this.radiusDegrees, this.professionId, this.urgentOnly = false});

  final LatLng? center;
  final double? radiusDegrees;
  final int? professionId;
  final bool urgentOnly;
}

/// One filter chip above the map.
class MapFilterOption {
  const MapFilterOption(this.id, this.label);

  final int id;
  final String label;
}

/// A full-screen map of things with coordinates (jobs, workers, employers): grouped pins that
/// split apart as you zoom in, a card for the tapped one, filters, "search this area" after
/// moving, and the user's own position.
class ExploreMap<T> extends StatefulWidget {
  const ExploreMap({
    super.key,
    required this.load,
    required this.idOf,
    required this.pointOf,
    required this.markerSize,
    required this.markerBuilder,
    required this.cardBuilder,
    required this.emptyText,
    this.filters = const [],
    this.showUrgentFilter = false,
    this.fallbackCenter,
  });

  final Future<List<T>> Function(MapQuery query) load;
  final Object Function(T item) idOf;
  final LatLng Function(T item) pointOf;
  final Size markerSize;
  final Widget Function(BuildContext context, T item, bool selected) markerBuilder;

  /// The panel for the selected item; [distance] is null until the user's position is known.
  final Widget Function(BuildContext context, T item, String? distance) cardBuilder;
  final String emptyText;
  final List<MapFilterOption> filters;
  final bool showUrgentFilter;

  /// Where to look when there is nothing to show and the user's position is unknown, e.g. the
  /// place set in their profile.
  final LatLng? fallbackCenter;

  @override
  State<ExploreMap<T>> createState() => _ExploreMapState<T>();
}

class _ExploreMapState<T> extends State<ExploreMap<T>> {
  final _controller = MapController();

  List<T> _items = const [];
  bool _loading = true;
  Object? _error;
  T? _selected;
  UserLocation? _me;
  bool _locating = false;
  bool _ready = false;
  bool _moved = false;
  bool _fitPending = true;
  int? _professionId;
  bool _urgentOnly = false;

  /// Bumped per request, so an older, slower answer cannot overwrite a newer one.
  int _generation = 0;

  @override
  void initState() {
    super.initState();
    quietUserLocation().then((me) {
      if (!mounted || me == null) return;
      setState(() => _me = me);
      if (_ready && !_loading && _items.isEmpty) _controller.move(me.point, 12);
    });
    _reload(area: false);
  }

  Future<void> _reload({required bool area}) async {
    final generation = ++_generation;
    final camera = _ready ? _controller.camera : null;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await widget.load(MapQuery(
        center: area ? camera?.center : null,
        radiusDegrees: area && camera != null ? visibleRadiusDegrees(camera) : null,
        professionId: _professionId,
        urgentOnly: _urgentOnly,
      ));
      if (!mounted || generation != _generation) return;
      setState(() {
        _items = items;
        _loading = false;
        _moved = false;
        final keep = _selected;
        _selected = keep != null && items.any((i) => widget.idOf(i) == widget.idOf(keep)) ? keep : null;
        // A fresh search (not "this area") frames what it found.
        if (!area) _fitPending = true;
      });
      _fitIfNeeded();
    } catch (e) {
      if (!mounted || generation != _generation) return;
      setState(() {
        _loading = false;
        _error = e;
      });
    }
  }

  void _fitIfNeeded() {
    if (!_ready || !_fitPending || _loading) return;
    _fitPending = false;
    final points = _items.map(widget.pointOf).toList();
    if (points.isEmpty) {
      _controller.move(_me?.point ?? widget.fallbackCenter ?? uzbekistanCenter,
          _me != null || widget.fallbackCenter != null ? 12 : 6);
    } else if (points.length == 1) {
      _controller.move(points.first, 14);
    } else {
      _controller.fitCamera(CameraFit.coordinates(
        coordinates: points,
        padding: const EdgeInsets.fromLTRB(48, 140, 48, 220),
        maxZoom: 15,
      ));
    }
  }

  Future<void> _locate() async {
    setState(() => _locating = true);
    final me = await requestUserLocation(context);
    if (!mounted) return;
    setState(() {
      _locating = false;
      if (me != null) _me = me;
    });
    if (me != null) {
      _controller.move(me.point, 14);
      setState(() => _moved = true);
    }
  }

  void _select(T item) {
    setState(() => _selected = item);
    final camera = _controller.camera;
    // Keep the pin above the card that slides in at the bottom.
    final target = widget.pointOf(item);
    final zoom = camera.zoom < 13 ? 13.0 : camera.zoom;
    final pixel = camera.project(target, zoom);
    _controller.move(camera.unproject(Point(pixel.x, pixel.y + 90), zoom), zoom);
  }

  String? _distanceTo(T item) {
    final me = _me;
    if (me == null) return null;
    return formatDistance(context, distanceBetween(me.point, widget.pointOf(item)));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final selected = _selected;
    final hasFilters = widget.filters.isNotEmpty || widget.showUrgentFilter;

    final markers = [
      for (final item in _items)
        Marker(
          key: ValueKey(widget.idOf(item)),
          point: widget.pointOf(item),
          width: widget.markerSize.width,
          height: widget.markerSize.height,
          alignment: Alignment.topCenter,
          child: GestureDetector(
            onTap: () => _select(item),
            child: widget.markerBuilder(
                context, item, selected != null && widget.idOf(selected) == widget.idOf(item)),
          ),
        ),
    ];

    return Stack(
      children: [
        AppMap(
          controller: _controller,
          myLocation: _me,
          onMapReady: () {
            _ready = true;
            _fitIfNeeded();
          },
          onTap: (_, __) {
            if (_selected != null) setState(() => _selected = null);
          },
          onPositionChanged: (camera, hasGesture) {
            if (hasGesture && !_moved && !_loading) setState(() => _moved = true);
          },
          layers: [
            MarkerClusterLayerWidget(
              options: MarkerClusterLayerOptions(
                markers: markers,
                maxClusterRadius: 60,
                disableClusteringAtZoom: 16,
                size: const Size(46, 46),
                computeSize: (m) => ClusterBubble.sizeFor(m.length),
                alignment: Alignment.center,
                padding: const EdgeInsets.fromLTRB(48, 140, 48, 220),
                maxZoom: 16,
                showPolygon: false,
                spiderfyCircleRadius: 60,
                markerChildBehavior: true,
                builder: (context, group) => ClusterBubble(count: group.length),
              ),
            ),
          ],
        ),

        // Filters and the result count, over the top of the map.
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          child: SafeArea(
            bottom: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (hasFilters)
                  SizedBox(
                    height: 48,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                      children: [
                        if (widget.showUrgentFilter)
                          _MapChip(
                            label: context.l10n.urgentOnlyFilter,
                            icon: Icons.bolt_rounded,
                            selected: _urgentOnly,
                            color: cs.error,
                            onTap: () {
                              setState(() => _urgentOnly = !_urgentOnly);
                              _reload(area: false);
                            },
                          ),
                        if (widget.filters.isNotEmpty)
                          _MapChip(
                            label: context.l10n.allFilterOption,
                            selected: _professionId == null,
                            onTap: () {
                              if (_professionId == null) return;
                              setState(() => _professionId = null);
                              _reload(area: false);
                            },
                          ),
                        for (final f in widget.filters)
                          _MapChip(
                            label: f.label,
                            selected: _professionId == f.id,
                            onTap: () {
                              setState(() => _professionId = _professionId == f.id ? null : f.id);
                              _reload(area: false);
                            },
                          ),
                      ],
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                  child: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 200),
                    child: _moved
                        ? Center(
                            key: const ValueKey('area'),
                            child: SearchAreaButton(onPressed: () => _reload(area: true), loading: _loading),
                          )
                        : (!_loading && _error == null && _items.isNotEmpty)
                            ? _CountPill(key: const ValueKey('count'), text: context.l10n.mapResultsCount(_items.length))
                            : const SizedBox.shrink(key: ValueKey('none')),
                  ),
                ),
              ],
            ),
          ),
        ),

        if (_loading && !_moved)
          const Positioned(top: 0, left: 0, right: 0, child: SafeArea(child: LinearProgressIndicator(minHeight: 2))),

        // Controls on the right, kept above the card.
        AnimatedPositioned(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          right: 12,
          bottom: (selected != null ? 212 : 40) + MediaQuery.paddingOf(context).bottom,
          child: MapControls(controller: _controller, onLocate: _locate, locating: _locating),
        ),

        // The selected item, or what went wrong, or that there is nothing here.
        Positioned(
          left: 12,
          right: 12,
          // Leaves the strip at the very bottom for the map's attribution.
          bottom: 28 + MediaQuery.paddingOf(context).bottom,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            switchInCurve: Curves.easeOutCubic,
            transitionBuilder: (child, animation) => SlideTransition(
              position: Tween(begin: const Offset(0, 0.25), end: Offset.zero).animate(animation),
              child: FadeTransition(opacity: animation, child: child),
            ),
            child: selected != null
                ? KeyedSubtree(
                    key: ValueKey(widget.idOf(selected)),
                    child: widget.cardBuilder(context, selected, _distanceTo(selected)),
                  )
                : _error != null
                    ? _NoticeCard(
                        key: const ValueKey('error'),
                        icon: Icons.wifi_off_rounded,
                        text: _error is ApiException ? (_error as ApiException).message : context.l10n.locationUnavailable,
                        action: context.l10n.retryAction,
                        onAction: () => _reload(area: false),
                      )
                    : (!_loading && _items.isEmpty)
                        ? _NoticeCard(key: const ValueKey('empty'), icon: Icons.travel_explore, text: widget.emptyText)
                        : const SizedBox.shrink(key: ValueKey('nothing')),
          ),
        ),
      ],
    );
  }
}

class _MapChip extends StatelessWidget {
  const _MapChip({required this.label, required this.selected, required this.onTap, this.icon, this.color});

  final String label;
  final bool selected;
  final VoidCallback onTap;
  final IconData? icon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final accent = color ?? cs.primary;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Material(
        color: selected ? accent : cs.surface,
        elevation: 2,
        shadowColor: Colors.black26,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 16, color: selected ? Colors.white : accent),
                  const SizedBox(width: 4),
                ],
                Text(
                  label,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: selected ? Colors.white : cs.onSurface,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CountPill extends StatelessWidget {
  const _CountPill({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Align(
      alignment: Alignment.centerLeft,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: cs.surface.withValues(alpha: 0.92),
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          child: Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: cs.onSurfaceVariant)),
        ),
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({super.key, required this.icon, required this.text, this.action, this.onAction});

  final IconData icon;
  final String text;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: EdgeInsets.zero,
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
        child: Row(
          children: [
            Icon(icon, color: cs.onSurfaceVariant),
            const SizedBox(width: 12),
            Expanded(child: Text(text, style: TextStyle(color: cs.onSurfaceVariant, height: 1.3))),
            if (action != null) TextButton(onPressed: onAction, child: Text(action!)),
          ],
        ),
      ),
    );
  }
}

/// The card shown at the bottom for the selected pin: a leading picture, two lines of text, a
/// row of small facts and one main action.
class MapItemCard extends StatelessWidget {
  const MapItemCard({
    super.key,
    required this.leading,
    required this.title,
    this.subtitle,
    this.facts = const [],
    required this.actionLabel,
    required this.onAction,
    this.onTap,
    this.badges = const [],
  });

  final Widget leading;
  final String title;
  final String? subtitle;
  final List<Widget> badges;
  final List<MapFact> facts;
  final String actionLabel;
  final VoidCallback onAction;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      margin: EdgeInsets.zero,
      elevation: 6,
      shadowColor: Colors.black38,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: InkWell(
        onTap: onTap ?? onAction,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  leading,
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, height: 1.25)),
                        if (subtitle != null && subtitle!.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Text(subtitle!,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
                        ],
                        if (badges.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Wrap(spacing: 6, runSpacing: 6, children: badges),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: Wrap(
                      spacing: 12,
                      runSpacing: 4,
                      children: [for (final f in facts) f],
                    ),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: onAction,
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      minimumSize: const Size(0, 38),
                    ),
                    child: Text(actionLabel),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A small icon and text, e.g. the price or the distance.
class MapFact extends StatelessWidget {
  const MapFact({super.key, required this.icon, required this.text, this.strong = false});

  final IconData icon;
  final String text;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final color = strong ? cs.primary : cs.onSurfaceVariant;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 15, color: color),
        const SizedBox(width: 4),
        Text(text,
            style: TextStyle(fontSize: 12.5, color: color, fontWeight: strong ? FontWeight.w700 : FontWeight.w500)),
      ],
    );
  }
}
