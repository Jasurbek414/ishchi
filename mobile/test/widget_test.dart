import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:ishchi/app.dart';

void main() {
  testWidgets('App boots to the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: IshchiApp()));
    await tester.pump();

    expect(find.text('Ishchi'), findsOneWidget);
  });
}
