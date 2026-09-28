import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme.dart';
import '../../l10n/l10n_x.dart';
import '../../state/worker_providers.dart';
import '../../widgets/async_view.dart';
import '../../state/rating_providers.dart';
import '../../widgets/report_sheet.dart';
import '../../widgets/trust_badges.dart';
import '../../widgets/user_avatar.dart';

class WorkerDetailScreen extends ConsumerWidget {
  const WorkerDetailScreen({super.key, required this.workerId});

  final int workerId;

  Future<void> _call(BuildContext context, String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (!await launchUrl(uri)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.l10n.callFailedError(phone))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final hsl = HSLColor.fromColor(cs.primary);
    final lighter = hsl.withLightness((hsl.lightness + 0.20).clamp(0.0, 1.0)).toColor();
    final workerAsync = ref.watch(workerDetailProvider(workerId));

    return Scaffold(
      backgroundColor: cs.surface,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
      ),
      body: AsyncView(
        value: workerAsync,
        onRetry: () => ref.invalidate(workerDetailProvider(workerId)),
        data: (worker) => ListView(
          padding: EdgeInsets.zero,
          children: [
            Container(
              width: double.infinity,
              padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 56, bottom: 28, left: 24, right: 24),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [lighter, cs.primary], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(28), bottomRight: Radius.circular(28)),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: UserAvatar(url: worker.avatarUrl, name: worker.fullName, radius: 46),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    worker.fullName,
                    style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${worker.regionName}, ${worker.districtName}',
                    style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.85)),
                  ),
                  if (worker.verified || worker.ratingCount > 0 || worker.availableToday) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      alignment: WrapAlignment.center,
                      spacing: 6,
                      runSpacing: 6,
                      children: [
                        if (worker.verified) const VerifiedBadge(),
                        RatingBadge(average: worker.ratingAverage, count: worker.ratingCount),
                        if (worker.availableToday) const AvailableTodayBadge(),
                      ],
                    ),
                  ],
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          worker.available ? PhosphorIcons.checkCircle(PhosphorIconsStyle.fill) : PhosphorIcons.clockCountdown(PhosphorIconsStyle.fill),
                          size: 14,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          worker.available ? context.l10n.availableForWork : context.l10n.currentlyBusy,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (worker.professions.isNotEmpty) ...[
                    Text(context.l10n.professionsLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: worker.professions
                          .map((p) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: cs.primary.withValues(alpha: 0.10),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: cs.primary.withValues(alpha: 0.25)),
                                ),
                                child: Text(p.name, style: TextStyle(color: cs.primary, fontWeight: FontWeight.w700, fontSize: 12.5)),
                              ))
                          .toList(),
                    ),
                    const SizedBox(height: 22),
                  ],
                  Text(context.l10n.informationLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  _InfoCard(
                    rows: [
                      _InfoRowData(icon: PhosphorIcons.mapPin(PhosphorIconsStyle.fill), label: context.l10n.fieldRegion, value: '${worker.regionName}, ${worker.districtName}'),
                      if (worker.experienceYears != null)
                        _InfoRowData(icon: PhosphorIcons.medal(PhosphorIconsStyle.fill), label: context.l10n.experienceLabel, value: context.l10n.experienceYearsValue(worker.experienceYears!)),
                      if (worker.workPreference != null)
                        _InfoRowData(icon: PhosphorIcons.briefcase(PhosphorIconsStyle.fill), label: context.l10n.jobTypeLabel, value: worker.workPreference!.label(context)),
                      if (worker.hasDriverLicense)
                        _InfoRowData(
                          icon: PhosphorIcons.identificationCard(PhosphorIconsStyle.fill),
                          label: context.l10n.driverLicenseLabel,
                          value: (worker.driverLicenseCategories?.isNotEmpty ?? false)
                              ? context.l10n.driverLicenseWithCategory(worker.driverLicenseCategories!)
                              : context.l10n.driverLicenseYes,
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Text(context.l10n.ratingsTitle,
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  _WorkerRatings(userId: worker.userId),
                  const SizedBox(height: 12),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      onPressed: () => ReportSheet.show(
                        context,
                        reportedUserId: worker.userId,
                        subtitle: worker.fullName,
                      ).then((sent) {
                        if (sent && context.mounted) {
                          ScaffoldMessenger.of(context)
                              .showSnackBar(SnackBar(content: Text(context.l10n.reportSentSuccess)));
                        }
                      }),
                      icon: Icon(PhosphorIcons.flag(), size: 18, color: cs.error),
                      label: Text(context.l10n.reportAction, style: TextStyle(color: cs.error)),
                    ),
                  ),
                  if (worker.about != null && worker.about!.isNotEmpty) ...[
                    const SizedBox(height: 22),
                    Text(context.l10n.aboutMeLabel, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: cs.surfaceContainerHigh, borderRadius: BorderRadius.circular(16)),
                      child: Text(worker.about!, style: const TextStyle(height: 1.5, fontSize: 13.5)),
                    ),
                  ],
                  if (worker.experiences.isNotEmpty) ...[
                    const SizedBox(height: 22),
                    Text(context.l10n.workExperienceSectionTitle, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
                    const SizedBox(height: 8),
                    Container(
                      decoration: BoxDecoration(color: cs.surfaceContainerHigh, borderRadius: BorderRadius.circular(16)),
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      child: Column(
                        children: [
                          for (var i = 0; i < worker.experiences.length; i++) ...[
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.12), shape: BoxShape.circle),
                                    child: Icon(PhosphorIcons.buildings(PhosphorIconsStyle.fill), color: cs.primary, size: 18),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(worker.experiences[i].positionTitle, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                        const SizedBox(height: 2),
                                        Text(worker.experiences[i].companyName, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${worker.experiences[i].startDate.year} — ${worker.experiences[i].isCurrent ? context.l10n.presentDate : worker.experiences[i].endDate!.year}',
                                          style: TextStyle(color: cs.onSurfaceVariant, fontSize: 11.5),
                                        ),
                                        if (worker.experiences[i].description?.isNotEmpty ?? false) ...[
                                          const SizedBox(height: 6),
                                          Text(worker.experiences[i].description!, style: const TextStyle(fontSize: 12.5, height: 1.4)),
                                        ],
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (i != worker.experiences.length - 1) Divider(height: 1, color: cs.outlineVariant.withValues(alpha: 0.4)),
                          ],
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: workerAsync.valueOrNull == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
                child: ElevatedButton.icon(
                  onPressed: () => _call(context, workerAsync.value!.phone),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                    backgroundColor: context.themeSuccess,
                    foregroundColor: Colors.white,
                  ),
                  icon: const Icon(Icons.call, color: Colors.white),
                  label: Text(context.l10n.contactPhoneValue(workerAsync.value!.phone), style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ),
    );
  }
}

class _InfoRowData {
  const _InfoRowData({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;
}

/// What other employers said about this worker.
///
/// Read-only here: a rating can only be left from a job the two actually did together, so the entry
/// point for writing one lives on that job's shortlist rather than on a profile.
class _WorkerRatings extends ConsumerWidget {
  const _WorkerRatings({required this.userId});

  final int userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final ratingsAsync = ref.watch(userRatingsProvider(userId));

    return ratingsAsync.maybeWhen(
      data: (page) {
        if (page.content.isEmpty) {
          return Text(context.l10n.noRatingsYet,
              style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13));
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (final rating in page.content.take(5))
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        for (var star = 1; star <= 5; star++)
                          Icon(
                            star <= rating.score ? Icons.star_rounded : Icons.star_outline_rounded,
                            size: 15,
                            color: star <= rating.score ? cs.primary : cs.onSurfaceVariant,
                          ),
                      ],
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(rating.jobTitle,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          if (rating.comment != null && rating.comment!.isNotEmpty)
                            Text(rating.comment!,
                                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
          ],
        );
      },
      // A profile is still worth reading when the ratings fail to load.
      orElse: () => const SizedBox.shrink(),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.rows});

  final List<_InfoRowData> rows;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(color: cs.surfaceContainerHigh, borderRadius: BorderRadius.circular(16)),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
              child: Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.12), shape: BoxShape.circle),
                    child: Icon(rows[i].icon, color: cs.primary, size: 18),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(rows[i].label, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12)),
                        const SizedBox(height: 2),
                        Text(rows[i].value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (i != rows.length - 1) Divider(height: 1, color: cs.outlineVariant.withValues(alpha: 0.4)),
          ],
        ],
      ),
    );
  }
}
