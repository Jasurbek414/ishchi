import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../core/my_location.dart';
import '../../l10n/l10n_x.dart';
import '../../models/job.dart';
import '../../state/job_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/job_card.dart';
import '../../widgets/unlock_job_sheet.dart';

class JobsMapScreen extends ConsumerStatefulWidget {
  const JobsMapScreen({super.key});

  @override
  ConsumerState<JobsMapScreen> createState() => _JobsMapScreenState();
}

class _JobsMapScreenState extends ConsumerState<JobsMapScreen> {
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

  void _showJobSheet(BuildContext context, Job job) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        child: JobCard(
          job: job,
          onTap: () async {
            Navigator.pop(context);
            if (await confirmJobUnlock(context, ref, job)) {
              if (context.mounted) context.push('/worker/jobs/${job.id}');
            }
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final jobsAsync = ref.watch(jobsMapProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.jobsMapTitle)),
      body: AsyncView(
        value: jobsAsync,
        onRetry: () => ref.invalidate(jobsMapProvider),
        data: (jobs) {
          if (jobs.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  context.l10n.noJobsOnMapYet,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          final center = LatLng(
            jobs.map((j) => j.latitude!).reduce((a, b) => a + b) / jobs.length,
            jobs.map((j) => j.longitude!).reduce((a, b) => a + b) / jobs.length,
          );
          return Stack(
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(initialCenter: center, initialZoom: jobs.length == 1 ? 13 : 6),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'uz.ecos.ishchi.app',
                  ),
                  MarkerLayer(
                    markers: [
                      for (final job in jobs)
                        Marker(
                          point: LatLng(job.latitude!, job.longitude!),
                          width: 40,
                          height: 40,
                          alignment: Alignment.topCenter,
                          child: GestureDetector(
                            onTap: () => _showJobSheet(context, job),
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
                  heroTag: 'locate-me-jobs',
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
