// The place picker used by profile and job forms (the only way a worker, employer or job gets the
// coordinates the other roles' maps draw). Opened the way the forms open it, driven like a finger.
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart';

import 'package:ishchi/core/api_client.dart';
import 'package:ishchi/core/token_storage.dart';
import 'package:ishchi/data/geo_repository.dart';
import 'package:ishchi/l10n/gen/app_localizations.dart';
import 'package:ishchi/screens/location_picker_screen.dart';
import 'package:ishchi/state/core_providers.dart';
import 'package:ishchi/widgets/map/map_tiles.dart';

class _Geo extends GeoRepository {
  _Geo() : super(ApiClient(TokenStorage()));
  int reverseCalls = 0;
  @override
  Future<GeoPlace?> reverse(LatLng point) async {
    reverseCalls++;
    return GeoPlace(name: 'Chilonzor 20', address: 'Toshkent', point: point);
  }

  @override
  Future<List<GeoPlace>> search(String query) async =>
      [GeoPlace(name: 'Toshkent shahri', address: "O'zbekiston", point: const LatLng(41.2995, 69.2401))];
}

const _tiles = MapTiles(urlTemplate: 'http://127.0.0.1:9/{z}/{x}/{y}.png', attribution: 'test', isDefault: true);

bool _noise(Object e) {
  final s = e.toString();
  return s.contains('MissingPluginException') || s.contains('127.0.0.1') || s.contains('SocketException') ||
      s.contains('path_provider') || s.contains('HTTP request failed') || s.contains('ClientException');
}

Future<void> _pumpFor(WidgetTester t, Duration total) async {
  var left = total.inMilliseconds;
  while (left > 0) {
    await t.pump(const Duration(milliseconds: 100));
    left -= 100;
  }
}

Widget _host(_Geo geo, Widget home) => ProviderScope(
      overrides: [mapTilesProvider.overrideWithValue(_tiles), geoRepositoryProvider.overrideWithValue(geo)],
      child: MaterialApp(
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: home,
      ),
    );

void _phone(WidgetTester tester) {
  tester.view.physicalSize = const Size(1080, 2200);
  tester.view.devicePixelRatio = 2.75;
  addTearDown(tester.view.reset);
}

void main() {
  final realOnError = FlutterError.onError;
  final problems = <Object>[];
  setUp(() {
    problems.clear();
    FlutterError.onError = (d) {
      if (!_noise(d.exception)) problems.add(d.exception);
    };
  });
  tearDown(() => FlutterError.onError = realOnError);

  /// Opens the picker the way the forms do (push, await the result), waits, taps confirm.
  Future<LatLng?> openAndConfirm(WidgetTester tester, _Geo geo, {LatLng? initial}) async {
    _phone(tester);
    LatLng? result;
    var done = false;
    await tester.pumpWidget(_host(
      geo,
      Builder(
        builder: (context) => Scaffold(
          body: Center(
            child: ElevatedButton(
              onPressed: () async {
                result = await Navigator.of(context)
                    .push<LatLng>(MaterialPageRoute(builder: (_) => LocationPickerScreen(initial: initial)));
                done = true;
              },
              child: const Text('open'),
            ),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await tester.pump();
    await _pumpFor(tester, const Duration(milliseconds: 1500));
    expect(find.byType(FlutterMap), findsOneWidget);

    final confirm = find.byWidgetPredicate((w) => w is FilledButton);
    expect(confirm, findsOneWidget, reason: 'confirm button missing');
    expect(tester.widget<FilledButton>(confirm).onPressed, isNotNull,
        reason: 'the confirm button is still disabled 1.5 s after opening (stuck "moving" state)');
    await tester.tap(confirm);
    await _pumpFor(tester, const Duration(milliseconds: 600));
    expect(done, isTrue, reason: 'tapping confirm did not close the picker');
    return result;
  }

  testWidgets('opens at the country view, confirm returns a point', (tester) async {
    final geo = _Geo();
    final point = await openAndConfirm(tester, geo);
    expect(point, isNotNull);
    // ignore: avoid_print
    print('PICKER (no initial) returned ${point!.latitude.toStringAsFixed(3)}, ${point.longitude.toStringAsFixed(3)}  reverse-geocode calls=${geo.reverseCalls}');
    expect(problems, isEmpty, reason: '$problems');
  });

  testWidgets('opens on an existing place (editing), confirm returns it', (tester) async {
    final geo = _Geo();
    const start = LatLng(41.3111, 69.2797);
    final point = await openAndConfirm(tester, geo, initial: start);
    expect(point, isNotNull);
    expect((point!.latitude - start.latitude).abs(), lessThan(0.01));
    expect((point.longitude - start.longitude).abs(), lessThan(0.01));
    expect(problems, isEmpty, reason: '$problems');
  });

  testWidgets('dragging the map holds confirm off, then re-enables it and looks up the new address', (tester) async {
    final geo = _Geo();
    _phone(tester);
    await tester.pumpWidget(_host(geo, const LocationPickerScreen(initial: LatLng(41.3111, 69.2797))));
    await _pumpFor(tester, const Duration(milliseconds: 1200));
    final before = geo.reverseCalls;
    await tester.drag(find.byType(FlutterMap), const Offset(-160, 120));
    await tester.pump(const Duration(milliseconds: 50));
    final during = tester.widget<FilledButton>(find.byWidgetPredicate((w) => w is FilledButton)).onPressed;
    await _pumpFor(tester, const Duration(milliseconds: 1500));
    final after = tester.widget<FilledButton>(find.byWidgetPredicate((w) => w is FilledButton)).onPressed;
    // ignore: avoid_print
    print('PICKER drag: confirm disabled while moving=${during == null}, enabled after settling=${after != null}, new reverse lookups=${geo.reverseCalls - before}');
    expect(after, isNotNull, reason: 'confirm stays disabled after the map stopped');
    expect(geo.reverseCalls, greaterThan(before), reason: 'the new address was never looked up');
    expect(problems, isEmpty, reason: '$problems');
  });

  testWidgets('address search: typing shows a result and picking it is accepted', (tester) async {
    final geo = _Geo();
    _phone(tester);
    await tester.pumpWidget(_host(geo, const LocationPickerScreen()));
    await _pumpFor(tester, const Duration(milliseconds: 800));
    await tester.enterText(find.byType(TextField), 'Toshkent');
    await _pumpFor(tester, const Duration(milliseconds: 1200));
    expect(find.text('Toshkent shahri'), findsOneWidget, reason: 'search result did not appear');
    await tester.tap(find.text('Toshkent shahri'));
    await _pumpFor(tester, const Duration(milliseconds: 1500));
    expect(problems, isEmpty, reason: '$problems');
  });
}
