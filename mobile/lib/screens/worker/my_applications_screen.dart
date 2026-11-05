import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/formatters.dart';
import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../state/application_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/empty_state.dart';

/// The worker's own responses, so they can see which ones went anywhere.
///
/// Where they were hired and the job has finished, this is also where they rate the employer — the
/// other half of a rating system that only works because both sides can leave one.
class MyApplicationsScreen extends ConsumerWidget {
  const MyApplicationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final applicationsAsync = ref.watch(myApplicationsProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.myResponsesMenu)),
      body: AsyncView(
        value: applicationsAsync,
        onRetry: () => ref.invalidate(myApplicationsProvider),
        data: (page) {
          if (page.content.isEmpty) {
            return EmptyState(
              icon: Icons.how_to_reg_outlined,
              message: context.l10n.noResponsesYet,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: page.content.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, index) {
              final application = page.content[index];
              return Card(
                child: ListTile(
                  title: Text(application.jobTitle,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '${application.status.label(context)} · '
                      '${Formatters.date(application.createdAt)}',
                      style: TextStyle(
                        color: application.status == ApplicationStatus.hired
                            ? cs.primary
                            : cs.onSurfaceVariant,
                        fontSize: 12.5,
                        fontWeight: application.status == ApplicationStatus.hired
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                    ),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/worker/jobs/${application.jobId}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
