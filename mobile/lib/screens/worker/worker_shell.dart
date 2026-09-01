import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../l10n/l10n_x.dart';
import '../../widgets/app_bottom_nav.dart';
import '../profile_screen.dart';
import 'worker_home_screen.dart';
import 'worker_jobs_screen.dart';

class WorkerShell extends StatefulWidget {
  const WorkerShell({super.key});

  @override
  State<WorkerShell> createState() => _WorkerShellState();
}

class _WorkerShellState extends State<WorkerShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      WorkerHomeScreen(onSeeAllJobs: () => setState(() => _index = 1)),
      const WorkerJobsScreen(),
      const ProfileScreen(),
    ];
    final items = [
      NavItem(icon: PhosphorIcons.house(), activeIcon: PhosphorIcons.house(PhosphorIconsStyle.fill), label: context.l10n.homeTabLabel),
      NavItem(icon: PhosphorIcons.listChecks(), activeIcon: PhosphorIcons.listChecks(PhosphorIconsStyle.fill), label: context.l10n.jobsTabLabel),
      NavItem(icon: PhosphorIcons.user(), activeIcon: PhosphorIcons.user(PhosphorIconsStyle.fill), label: context.l10n.profileTitle),
    ];

    return Scaffold(
      // The floating pill nav is a frosted-glass shape with gaps around it by
      // design; extendBody lets the actual page content (not a flat scaffold
      // color) show/blur through those gaps instead of a bare rectangle.
      extendBody: true,
      body: IndexedStack(index: _index, children: screens),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: items,
      ),
    );
  }
}
