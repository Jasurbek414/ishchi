import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../l10n/l10n_x.dart';
import '../../widgets/app_bottom_nav.dart';
import '../profile_screen.dart';
import 'my_jobs_screen.dart';
import 'worker_search_screen.dart';

class EmployerShell extends StatefulWidget {
  const EmployerShell({super.key});

  @override
  State<EmployerShell> createState() => _EmployerShellState();
}

class _EmployerShellState extends State<EmployerShell> {
  int _index = 0;

  static const _screens = [
    WorkerSearchScreen(),
    MyJobsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final items = [
      NavItem(icon: PhosphorIcons.magnifyingGlass(), activeIcon: PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.fill), label: context.l10n.workerSearchTabLabel),
      NavItem(icon: PhosphorIcons.briefcase(), activeIcon: PhosphorIcons.briefcase(PhosphorIconsStyle.fill), label: context.l10n.myJobsTitle),
      NavItem(icon: PhosphorIcons.user(), activeIcon: PhosphorIcons.user(PhosphorIconsStyle.fill), label: context.l10n.profileTitle),
    ];

    return Scaffold(
      // The floating pill nav is a frosted-glass shape with gaps around it by
      // design; extendBody lets the actual page content (not a flat scaffold
      // color) show/blur through those gaps instead of a bare rectangle.
      extendBody: true,
      body: IndexedStack(index: _index, children: _screens),
      bottomNavigationBar: AppBottomNav(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: items,
      ),
    );
  }
}
