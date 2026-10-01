import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ishchi/core/my_location.dart';
import 'package:ishchi/data/geo_repository.dart';
import 'package:ishchi/l10n/gen/app_localizations.dart';
import 'package:ishchi/widgets/map/app_map.dart';

/// Renders [read] under the given locale and returns what it produced.
Future<String> _format(WidgetTester tester, Locale locale, String Function(BuildContext) read) async {
  late String out;
  await tester.pumpWidget(MaterialApp(
    locale: locale,
    supportedLocales: AppLocalizations.supportedLocales,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    home: Builder(builder: (context) {
      out = read(context);
      return const SizedBox();
    }),
  ));
  return out;
}

void main() {
  testWidgets('prices on pins are short', (tester) async {
    const uz = Locale('uz');
    expect(await _format(tester, uz, (c) => compactPrice(c, 150000)), '150 ming');
    expect(await _format(tester, uz, (c) => compactPrice(c, 1200000)), '1,2 mln');
    expect(await _format(tester, uz, (c) => compactPrice(c, 2000000)), '2 mln');
    expect(await _format(tester, const Locale('en'), (c) => compactPrice(c, 1500)), '1.5k');
  });

  testWidgets('distances round to what a person can use', (tester) async {
    const uz = Locale('uz');
    expect(await _format(tester, uz, (c) => formatDistance(c, 347)), '350 m');
    expect(await _format(tester, uz, (c) => formatDistance(c, 1240)), '1,2 km');
    expect(await _format(tester, uz, (c) => formatDistance(c, 23600)), '24 km');
  });

  testWidgets('Uzbek text shows single apostrophes', (tester) async {
    final text = await _format(tester, const Locale('uz'), (c) => AppLocalizations.of(c).viewEmployersOnMapTooltip);
    expect(text, contains("ko'rish"));
    expect(text, isNot(contains("''")));
  });

  test('geo places parse with or without an area line', () {
    final full = GeoPlace.fromJson({'name': 'Chorsu bozori', 'address': 'Toshkent', 'latitude': 41.32, 'longitude': 69.23});
    expect(full.address, 'Toshkent');
    expect(full.point.latitude, 41.32);
    final bare = GeoPlace.fromJson({'name': 'Navoiy', 'latitude': 40, 'longitude': 65});
    expect(bare.address, isNull);
  });
}
