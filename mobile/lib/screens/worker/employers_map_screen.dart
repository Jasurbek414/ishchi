import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../core/my_location.dart';
import '../../l10n/l10n_x.dart';
import '../../models/employer.dart';
import '../../state/employer_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/user_avatar.dart';

class EmployersMapScreen extends ConsumerStatefulWidget {
  const EmployersMapScreen({super.key});

  @override
  ConsumerState<EmployersMapScreen> createState() => _EmployersMapScreenState();
}

class _EmployersMapScreenState extends ConsumerState<EmployersMapScreen> {
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

  void _showEmployerSheet(BuildContext context, Employer employer) {
    final cs = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  UserAvatar(url: employer.avatarUrl, name: employer.fullName, radius: 26),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(employer.fullName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 2),
                        Text('${employer.regionName}, ${employer.districtName}',
                            style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
                      ],
                    ),
                  ),
                ],
              ),
              if (employer.about != null && employer.about!.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(employer.about!, style: const TextStyle(height: 1.4)),
              ],
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  context.push('/worker/jobs-map');
                },
                icon: const Icon(Icons.work_outline, color: Colors.white),
                label: Text(context.l10n.viewTheirJobsAction),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final employersAsync = ref.watch(employersMapProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.employersMapTitle)),
      body: AsyncView(
        value: employersAsync,
        onRetry: () => ref.invalidate(employersMapProvider),
        data: (employers) {
          if (employers.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  context.l10n.noEmployersOnMapYet,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          final center = LatLng(
            employers.map((e) => e.latitude!).reduce((a, b) => a + b) / employers.length,
            employers.map((e) => e.longitude!).reduce((a, b) => a + b) / employers.length,
          );
          return Stack(
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(initialCenter: center, initialZoom: employers.length == 1 ? 13 : 6),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'uz.ecos.ishchi.app',
                  ),
                  MarkerLayer(
                    markers: [
                      for (final employer in employers)
                        Marker(
                          point: LatLng(employer.latitude!, employer.longitude!),
                          width: 40,
                          height: 40,
                          alignment: Alignment.topCenter,
                          child: GestureDetector(
                            onTap: () => _showEmployerSheet(context, employer),
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
                  heroTag: 'locate-me-employers',
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
