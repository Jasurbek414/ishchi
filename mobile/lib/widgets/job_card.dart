import 'package:flutter/material.dart';

import '../core/formatters.dart';
import '../models/job.dart';
import '../core/theme.dart';
import '../l10n/l10n_x.dart';
import 'status_badge.dart';
import 'trust_badges.dart';

class JobCard extends StatelessWidget {
  const JobCard({super.key, required this.job, required this.onTap});

  final Job job;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      job.title,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ),
                  StatusBadge(status: job.status),
                ],
              ),
              if (job.urgent || job.hasResponded || (job.applicationCount ?? 0) > 0) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    if (job.urgent) const UrgentBadge(),
                    if (job.hasResponded)
                      SignalBadge(
                        icon: Icons.check_circle_outline,
                        label: context.l10n.respondedLabel,
                        color: context.themeSuccess,
                      ),
                    if (!job.hasResponded && (job.applicationCount ?? 0) > 0)
                      SignalBadge(
                        icon: Icons.people_outline,
                        label: context.l10n.responsesCount(job.applicationCount!),
                        color: cs.onSurfaceVariant,
                      ),
                  ],
                ),
              ],
              const SizedBox(height: 6),
              Row(
                children: [
                  Icon(Icons.location_on_outlined, size: 16, color: cs.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(job.location,
                        style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                job.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: cs.onSurface, fontSize: 13.5, height: 1.35),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.payments_outlined, size: 18, color: cs.primary),
                  const SizedBox(width: 4),
                  Text(
                    Formatters.money(context, job.payment),
                    style: TextStyle(fontWeight: FontWeight.w700, color: cs.primary),
                  ),
                  if (job.durationLabel(context) != null) ...[
                    const SizedBox(width: 14),
                    Icon(Icons.schedule, size: 16, color: cs.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text(job.durationLabel(context)!, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
                  ],
                  const Spacer(),
                  Text(Formatters.timeAgo(context, job.createdAt),
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
