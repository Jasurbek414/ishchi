import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../l10n/l10n_x.dart';
import '../../models/enums.dart';
import '../../state/job_providers.dart';
import '../../widgets/async_view.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/job_card.dart';
import '../../widgets/app_bottom_nav.dart';

class MyJobsScreen extends ConsumerStatefulWidget {
  const MyJobsScreen({super.key});

  @override
  ConsumerState<MyJobsScreen> createState() => _MyJobsScreenState();
}

class _MyJobsScreenState extends ConsumerState<MyJobsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  static const _statuses = <JobStatus?>[null, JobStatus.active, JobStatus.inProgress, JobStatus.completed, JobStatus.cancelled];

  String _tabLabel(BuildContext context, JobStatus? status) => switch (status) {
        null => context.l10n.allFilterOption,
        JobStatus.active => context.l10n.jobStatusActive,
        JobStatus.inProgress => context.l10n.jobStatusInProgress,
        JobStatus.completed => context.l10n.jobStatusCompleted,
        JobStatus.cancelled => context.l10n.jobStatusCancelled,
        JobStatus.expired => context.l10n.jobStatusExpired,
      };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _statuses.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.myJobsTitle),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: _statuses.map((s) => Tab(text: _tabLabel(context, s))).toList(),
        ),
      ),
      // The outer shell Scaffold uses extendBody so the floating bottom nav pill
      // can blur real content behind it — that means this nested Scaffold's body
      // now extends behind the pill too, so the FAB needs an explicit lift to
      // clear it instead of sitting at its default bottom-right margin.
      floatingActionButton: Padding(
        padding: EdgeInsets.only(bottom: bottomNavClearance(context)),
        child: FloatingActionButton.extended(
          onPressed: () => context.push('/employer/jobs/new'),
          icon: Icon(Icons.add, color: cs.onPrimary),
          label: Text(context.l10n.newJobAction, style: TextStyle(color: cs.onPrimary)),
          backgroundColor: cs.primary,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _statuses.map((status) => _JobsTab(status: status)).toList(),
      ),
    );
  }
}

class _JobsTab extends ConsumerWidget {
  const _JobsTab({required this.status});

  final JobStatus? status;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobsAsync = ref.watch(myJobsProvider(status));

    return RefreshIndicator(
      onRefresh: () => ref.refresh(myJobsProvider(status).future),
      child: AsyncView(
        value: jobsAsync,
        onRetry: () => ref.invalidate(myJobsProvider(status)),
        data: (page) {
          if (page.content.isEmpty) {
            return ListView(
              children: [
                const SizedBox(height: 60),
                EmptyState(message: context.l10n.noJobsInThisTab, icon: Icons.inbox_outlined),
              ],
            );
          }
          return ListView.separated(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + bottomNavClearance(context)),
            itemCount: page.content.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, i) {
              final job = page.content[i];
              return JobCard(job: job, onTap: () => context.push('/employer/jobs/${job.id}/manage'));
            },
          );
        },
      ),
    );
  }
}
