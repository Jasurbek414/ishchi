import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../core/my_location.dart';
import '../../l10n/l10n_x.dart';
import '../../models/worker.dart';
import '../../state/worker_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/worker_card.dart';

class WorkersMapScreen extends ConsumerStatefulWidget {
  const WorkersMapScreen({super.key});

  @override
  ConsumerState<WorkersMapScreen> createState() => _WorkersMapScreenState();
}

class _WorkersMapScreenState extends ConsumerState<WorkersMapScreen> {
  final _mapController = MapController();
  LatLng? _myLocation;
  bool _locating = false;

  Future<void> _useCurrentLocation() async {
    setState(() => _locating = true);
    final point = await requestCurrentLocation(context);
    if (point != null) {
      setState(() => _myLocation = point);
      _mapController.move(point, 13);
    }
    if (mounted) setState(() => _locating = false);
  }

  void _showWorkerSheet(BuildContext context, Worker worker) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: WorkerCard(
          worker: worker,
          onTap: () {
            Navigator.pop(context);
            context.push('/employer/workers/${worker.id}');
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final workersAsync = ref.watch(workersMapProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.workersMapTitle)),
      body: AsyncView(
        value: workersAsync,
        onRetry: () => ref.invalidate(workersMapProvider),
        data: (workers) {
          if (workers.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  context.l10n.noWorkersOnMapYet,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          final center = LatLng(
            workers.map((w) => w.latitude!).reduce((a, b) => a + b) / workers.length,
            workers.map((w) => w.longitude!).reduce((a, b) => a + b) / workers.length,
          );
          return Stack(
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(initialCenter: center, initialZoom: workers.length == 1 ? 13 : 6),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'uz.ecos.ishchi.app',
                  ),
                  MarkerLayer(
                    markers: [
                      for (final worker in workers)
                        Marker(
                          point: LatLng(worker.latitude!, worker.longitude!),
                          width: 40,
                          height: 40,
                          alignment: Alignment.topCenter,
                          child: GestureDetector(
                            onTap: () => _showWorkerSheet(context, worker),
                            child: Icon(Icons.location_pin, color: cs.primary, size: 40),
                          ),
                        ),
                      if (_myLocation != null)
                        Marker(
                          point: _myLocation!,
                          width: 22,
                          height: 22,
                          child: Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.blue,
                              border: Border.all(color: Colors.white, width: 3),
                              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              Positioned(
                right: 16,
                bottom: 16,
                child: FloatingActionButton(
                  heroTag: 'locate-me-workers',
                  onPressed: _locating ? null : _useCurrentLocation,
                  foregroundColor: cs.onPrimary,
                  backgroundColor: cs.primary,
                  child: _locating
                      ? SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: cs.onPrimary))
                      : const Icon(Icons.my_location),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
