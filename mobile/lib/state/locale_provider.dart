import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core_providers.dart';

/// The 4 languages the app ships UI translations for. Uzbek Latin and Uzbek
/// Cyrillic are the same language with different scripts (BCP-47 script
/// subtag), not separate `Locale` language codes.
enum AppLanguage {
  uzLatin,
  uzCyrillic,
  russian,
  english;

  Locale get locale => switch (this) {
        AppLanguage.uzLatin => const Locale('uz'),
        AppLanguage.uzCyrillic => const Locale.fromSubtags(languageCode: 'uz', scriptCode: 'Cyrl'),
        AppLanguage.russian => const Locale('ru'),
        AppLanguage.english => const Locale('en'),
      };

  String get nativeName => switch (this) {
        AppLanguage.uzLatin => "O'zbekcha",
        AppLanguage.uzCyrillic => 'Ўзбекча',
        AppLanguage.russian => 'Русский',
        AppLanguage.english => 'English',
      };

  static AppLanguage fromPrefsValue(String? value) => switch (value) {
        'uzCyrillic' => AppLanguage.uzCyrillic,
        'russian' => AppLanguage.russian,
        'english' => AppLanguage.english,
        _ => AppLanguage.uzLatin,
      };
}

const _kLocaleKey = 'app_language';

class LocaleNotifier extends Notifier<AppLanguage> {
  // Read synchronously from the preferences opened in main(), so a Russian- or English-speaking
  // user never sees a frame of Uzbek before it switches over.
  @override
  AppLanguage build() {
    return AppLanguage.fromPrefsValue(ref.read(sharedPreferencesProvider).getString(_kLocaleKey));
  }

  Future<void> setLanguage(AppLanguage language) async {
    state = language;
    await ref.read(sharedPreferencesProvider).setString(_kLocaleKey, language.name);
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, AppLanguage>(LocaleNotifier.new);
