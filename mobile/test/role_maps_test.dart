// Exercises the map code of every role against REAL backend responses (captured from the server's
// own backend running on a throwaway database) instead of hand-written sample data.
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ishchi/core/api_client.dart';
import 'package:ishchi/core/token_storage.dart';
import 'package:ishchi/data/employer_repository.dart';
import 'package:ishchi/data/job_repository.dart';
import 'package:ishchi/data/worker_repository.dart';
import 'package:ishchi/l10n/gen/app_localizations.dart';
import 'package:ishchi/models/employer.dart';
import 'package:ishchi/models/job.dart';
import 'package:ishchi/models/profile.dart';
import 'package:ishchi/models/worker.dart';
import 'package:ishchi/screens/employer/workers_map_screen.dart';
import 'package:ishchi/screens/worker/employers_map_screen.dart';
import 'package:ishchi/screens/worker/jobs_map_screen.dart';
import 'package:ishchi/state/core_providers.dart';
import 'package:ishchi/state/profession_providers.dart';
import 'package:ishchi/state/profile_provider.dart';
import 'package:ishchi/widgets/app_bottom_nav.dart';
import 'package:ishchi/widgets/map/map_tiles.dart';

dynamic fx(String name) => jsonDecode(File('test/fixtures/$name.json').readAsStringSync());
List<dynamic> list(String name) => fx(name) as List<dynamic>;

class _Workers extends WorkerRepository {
  _Workers(this.items) : super(ApiClient(TokenStorage()));
  final List<Worker> items;
  @override
  Future<List<Worker>> mapSearch({int? regionId, int? professionId, double? latitude, double? longitude, double? radiusDegrees}) async => items;
}

class _ThrowingWorkers extends WorkerRepository {
  _ThrowingWorkers() : super(ApiClient(TokenStorage()));
  @override
  Future<List<Worker>> mapSearch({int? regionId, int? professionId, double? latitude, double? longitude, double? radiusDegrees}) async =>
      throw Exception('boom');
}

class _Jobs extends JobRepository {
  _Jobs(this.items) : super(ApiClient(TokenStorage()));
  final List<Job> items;
  @override
  Future<List<Job>> mapSearch({int? regionId, int? professionId, double? latitude, double? longitude, double? radiusDegrees, int? employerId, bool urgentOnly = false}) async => items;
}

class _Employers extends EmployerRepository {
  _Employers(this.items) : super(ApiClient(TokenStorage()));
  final List<Employer> items;
  @override
  Future<List<Employer>> mapSearch({int? regionId, double? latitude, double? longitude, double? radiusDegrees}) async => items;
}

class _FakeProfile extends ProfileNotifier {
  _FakeProfile(this.profile);
  final Profile profile;
  @override
  Future<Profile> build() async => profile;
}

const _tiles = MapTiles(urlTemplate: 'http://127.0.0.1:9/{z}/{x}/{y}.png', attribution: 'test', isDefault: true);

Widget _app(Widget home, {List<Override> overrides = const []}) => ProviderScope(
      overrides: [mapTilesProvider.overrideWithValue(_tiles), ...overrides],
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: home,
      ),
    );

/// Tile downloads cannot work inside `flutter test`; they must not be mistaken for map bugs.
bool _isTileNoise(Object e) {
  final s = e.toString();
  return s.contains('MissingPluginException') ||
      s.contains('127.0.0.1') ||
      s.contains('SocketException') ||
      s.contains('path_provider') ||
      s.contains('HTTP request failed') ||
      s.contains('ClientException');
}

Future<void> _settle(WidgetTester tester) async {
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 300));
  }
}

void _phone(WidgetTester tester) {
  tester.view.physicalSize = const Size(1080, 2200);
  tester.view.devicePixelRatio = 2.75;
  addTearDown(tester.view.reset);
}

void main() {
  final realOnError = FlutterError.onError;
  final collected = <Object>[];
  setUp(() {
    collected.clear();
    FlutterError.onError = (d) {
      if (!_isTileNoise(d.exception)) collected.add(d.exception);
    };
  });
  tearDown(() => FlutterError.onError = realOnError);

  group('contract: real backend JSON -> app models', () {
    test('EMPLOYER role: workers map pins parse and carry coordinates', () {
      final workers = list('employer_workers_map').map((e) => Worker.fromJson(e as Map<String, dynamic>)).toList();
      expect(workers, isNotEmpty);
      for (final w in workers) {
        expect(w.latitude, isNotNull, reason: 'a map pin without coordinates cannot be drawn');
        expect(w.longitude, isNotNull);
      }
    });

    test('EMPLOYER role: worker list page parses', () {
      final page = fx('employer_workers_list') as Map<String, dynamic>;
      final items = (page['content'] as List).map((e) => Worker.fromJson(e as Map<String, dynamic>)).toList();
      expect(items, isNotEmpty);
    });

    test('WORKER role: job pins parse and carry coordinates', () {
      final jobs = list('worker_jobs_map').map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
      expect(jobs, isNotEmpty);
      for (final j in jobs) {
        expect(j.latitude, isNotNull);
        expect(j.longitude, isNotNull);
      }
    });

    test('WORKER role: employer pins parse and carry coordinates', () {
      final emps = list('worker_employers_map').map((e) => Employer.fromJson(e as Map<String, dynamic>)).toList();
      expect(emps, isNotEmpty);
      for (final e in emps) {
        expect(e.latitude, isNotNull);
        expect(e.longitude, isNotNull);
      }
    });

    test('both roles: /profile parses', () {
      expect(Profile.fromJson(fx('employer_profile') as Map<String, dynamic>).role.name, 'employer');
      expect(Profile.fromJson(fx('worker_profile') as Map<String, dynamic>).role.name, 'worker');
    });
  });

  group('screens: every role map opens, draws and reacts', () {
    final workers = list('employer_workers_map').map((e) => Worker.fromJson(e as Map<String, dynamic>)).toList();
    final jobs = list('worker_jobs_map').map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
    final emps = list('worker_employers_map').map((e) => Employer.fromJson(e as Map<String, dynamic>)).toList();
    final employerProfile = Profile.fromJson(fx('employer_profile') as Map<String, dynamic>);
    final workerProfile = Profile.fromJson(fx('worker_profile') as Map<String, dynamic>);

    Future<void> openAndCheck(WidgetTester tester, Widget screen, List<Override> overrides, String label) async {
      _phone(tester);
      await tester.pumpWidget(_app(screen, overrides: overrides));
      await _settle(tester);
      expect(find.byType(FlutterMap), findsOneWidget, reason: '$label: the map widget is not on screen');
      expect(find.byIcon(Icons.wifi_off_rounded), findsNothing, reason: '$label: shows the error card');
      expect(collected, isEmpty, reason: '$label: exceptions while building/laying out: $collected');
    }

    testWidgets('EMPLOYER: workers map', (tester) async {
      await openAndCheck(
        tester,
        const WorkersMapScreen(),
        [
          workerRepositoryProvider.overrideWithValue(_Workers(workers)),
          profileProvider.overrideWith(() => _FakeProfile(employerProfile)),
          professionsProvider.overrideWith((ref) async => const []),
        ],
        'employer/workers map',
      );
    });

    testWidgets('WORKER: jobs map', (tester) async {
      await openAndCheck(
        tester,
        const JobsMapScreen(),
        [
          jobRepositoryProvider.overrideWithValue(_Jobs(jobs)),
          profileProvider.overrideWith(() => _FakeProfile(workerProfile)),
        ],
        'worker/jobs map',
      );
    });

    testWidgets('WORKER: employers map', (tester) async {
      await openAndCheck(
        tester,
        const EmployersMapScreen(),
        [
          employerRepositoryProvider.overrideWithValue(_Employers(emps)),
          profileProvider.overrideWith(() => _FakeProfile(workerProfile)),
        ],
        'worker/employers map',
      );
    });

    testWidgets('EMPLOYER: empty result shows the empty card, not a crash', (tester) async {
      _phone(tester);
      await tester.pumpWidget(_app(const WorkersMapScreen(), overrides: [
        workerRepositoryProvider.overrideWithValue(_Workers(const [])),
        profileProvider.overrideWith(() => _FakeProfile(employerProfile)),
        professionsProvider.overrideWith((ref) async => const []),
      ]));
      await _settle(tester);
      expect(find.byIcon(Icons.travel_explore), findsOneWidget);
      expect(collected, isEmpty, reason: '$collected');
    });

    testWidgets('EMPLOYER: a failing request shows the retry card', (tester) async {
      _phone(tester);
      await tester.pumpWidget(_app(const WorkersMapScreen(), overrides: [
        workerRepositoryProvider.overrideWithValue(_ThrowingWorkers()),
        profileProvider.overrideWith(() => _FakeProfile(employerProfile)),
        professionsProvider.overrideWith((ref) async => const []),
      ]));
      await _settle(tester);
      expect(find.byIcon(Icons.wifi_off_rounded), findsOneWidget);
      expect(collected, isEmpty, reason: '$collected');
    });
  });

  group('layout: the floating "new job" button above the floating bottom bar', () {
    Future<double> gapAbove(WidgetTester tester, EdgeInsets Function(BuildContext) lift) async {
      _phone(tester);
      final items = [
        NavItem(icon: Icons.search, activeIcon: Icons.search, label: 'a'),
        NavItem(icon: Icons.work_outline, activeIcon: Icons.work, label: 'b'),
        NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'c'),
      ];
      await tester.pumpWidget(MaterialApp(
        builder: (context, child) => SafeArea(top: false, bottom: true, child: child!), // as in app.dart
        home: Scaffold(
          extendBody: true,
          body: Builder(
            builder: (context) => Scaffold(
              floatingActionButton: Padding(
                padding: lift(context),
                child: FloatingActionButton.extended(onPressed: () {}, label: const Text("E'lon"), icon: const Icon(Icons.add)),
              ),
              body: const SizedBox.expand(),
            ),
          ),
          bottomNavigationBar: AppBottomNav(currentIndex: 0, onTap: (_) {}, items: items),
        ),
      ));
      await tester.pump();
      return tester.getRect(find.byType(AppBottomNav)).top - tester.getRect(find.byType(FloatingActionButton)).bottom;
    }

    testWidgets('old formula floated the button far above the bar; the corrected lift leaves a normal gap', (tester) async {
      final before = await gapAbove(tester, (c) => EdgeInsets.only(bottom: 66 + 14 + MediaQuery.paddingOf(c).bottom + 12));
      final after = await gapAbove(tester, (c) => EdgeInsets.only(bottom: MediaQuery.paddingOf(c).bottom));
      // ignore: avoid_print
      print('LAYOUT gap button->bar: OLD formula=${before.toStringAsFixed(1)}px   CORRECTED=${after.toStringAsFixed(1)}px');
      expect(before, greaterThan(80), reason: 'documents the bug: the old lift counted the bar twice');
      expect(after, inInclusiveRange(8, 28), reason: 'the button should sit a normal margin above the bar');
    });

    testWidgets('bottomNavClearance (list padding) equals the real bar height + a margin, not twice the bar', (tester) async {
      _phone(tester);
      double? clearance;
      await tester.pumpWidget(MaterialApp(
        builder: (context, child) => SafeArea(top: false, bottom: true, child: child!),
        home: Scaffold(
          extendBody: true,
          body: Builder(builder: (context) => Builder(builder: (context) {
            clearance = bottomNavClearance(context);
            return const SizedBox.expand();
          })),
          bottomNavigationBar: AppBottomNav(currentIndex: 0, onTap: (_) {}, items: [
            NavItem(icon: Icons.search, activeIcon: Icons.search, label: 'a'),
            NavItem(icon: Icons.work_outline, activeIcon: Icons.work, label: 'b'),
          ]),
        ),
      ));
      await tester.pump();
      final barHeight = tester.view.physicalSize.height / tester.view.devicePixelRatio - tester.getRect(find.byType(AppBottomNav)).top;
      // ignore: avoid_print
      print('LAYOUT list clearance=${clearance!.toStringAsFixed(1)}  bar occupies=${barHeight.toStringAsFixed(1)} from the bottom edge');
      expect(clearance!, inInclusiveRange(barHeight, barHeight + 24));
    });
  });
}
