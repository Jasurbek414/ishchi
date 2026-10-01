import 'package:flutter/material.dart';

import '../l10n/l10n_x.dart';
import '../models/worker.dart';
import 'trust_badges.dart';
import 'user_avatar.dart';

class WorkerCard extends StatelessWidget {
  const WorkerCard({super.key, required this.worker, required this.onTap});

  final Worker worker;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final professionNames = worker.professions.map((p) => p.name).join(', ');
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              UserAvatar(url: worker.avatarUrl, name: worker.fullName, radius: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(worker.fullName,
                              style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
                        ),
                        if (!worker.available)
                          Padding(
                            padding: const EdgeInsets.only(left: 6),
                            child: Text(context.l10n.busyStatus, style: TextStyle(color: cs.error, fontSize: 12)),
                          ),
                      ],
                    ),
                    if (worker.verified || worker.ratingCount > 0 || worker.availableToday) ...[
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          if (worker.verified) const VerifiedBadge(),
                          RatingBadge(average: worker.ratingAverage, count: worker.ratingCount),
                          if (worker.availableToday) const AvailableTodayBadge(),
                        ],
                      ),
                    ],
                    if (professionNames.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(professionNames,
                          style: TextStyle(color: cs.primary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined, size: 15, color: cs.onSurfaceVariant),
                        const SizedBox(width: 3),
                        Expanded(
                          child: Text('${worker.regionName}, ${worker.districtName}',
                              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5),
                              overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                    if (worker.experienceYears != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.workspace_premium_outlined, size: 15, color: cs.onSurfaceVariant),
                          const SizedBox(width: 3),
                          Text(context.l10n.experienceColonValue(worker.experienceYears!),
                              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
