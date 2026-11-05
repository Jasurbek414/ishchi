import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/design_tokens.dart';
import 'core_providers.dart';

// ─── Mavzu holati ────────────────────────────────────────────────────────────

class AppThemeState {
  const AppThemeState({
    this.seedColor = DesignTokens.primary,
    this.themeMode = ThemeMode.system,
  });

  final Color seedColor;
  final ThemeMode themeMode;

  AppThemeState copyWith({Color? seedColor, ThemeMode? themeMode}) {
    return AppThemeState(
      seedColor: seedColor ?? this.seedColor,
      themeMode: themeMode ?? this.themeMode,
    );
  }
}

// ─── Rang palitralari ─────────────────────────────────────────────────────────

class AppColorPalette {
  const AppColorPalette({
    required this.id,
    required this.color,
    required this.emoji,
  });

  /// Stable identifier used to look up the localized display name in the UI —
  /// the name itself can't live here since this list is a top-level `const`
  /// with no `BuildContext` to translate through.
  final String id;
  final Color color;
  final String emoji;
}

const List<AppColorPalette> kColorPalettes = [
  AppColorPalette(id: 'sky', color: DesignTokens.primary, emoji: '🌤'),
  AppColorPalette(id: 'burntOrange', color: Color(0xFFE8541F), emoji: '🟠'),
  AppColorPalette(id: 'blue', color: Color(0xFF2563EB), emoji: '🔵'),
  AppColorPalette(id: 'green', color: Color(0xFF16A34A), emoji: '🟢'),
  AppColorPalette(id: 'violet', color: Color(0xFF7C3AED), emoji: '🟣'),
  AppColorPalette(id: 'red', color: Color(0xFFDC2626), emoji: '🔴'),
  AppColorPalette(id: 'amber', color: Color(0xFFD97706), emoji: '🟡'),
  AppColorPalette(id: 'cyan', color: Color(0xFF0891B2), emoji: '🩵'),
  AppColorPalette(id: 'brown', color: Color(0xFF92400E), emoji: '🟤'),
];

// ─── Saqlash kalitlari ────────────────────────────────────────────────────────

const _kSeedColorKey = 'theme_seed_color';
const _kThemeModeKey = 'theme_mode';

// ─── Notifier ─────────────────────────────────────────────────────────────────

class ThemeNotifier extends Notifier<AppThemeState> {
  // Read straight out of the preferences opened in main() instead of awaiting them: the old
  // async read returned the default first and only then swapped in the user's saved colour,
  // which showed up as the app changing colour a moment after it opened.
  @override
  AppThemeState build() {
    final prefs = ref.read(sharedPreferencesProvider);
    final colorValue = prefs.getInt(_kSeedColorKey);
    final modeStr = prefs.getString(_kThemeModeKey);

    // No local choice saved yet — a fresh install. Use whatever default the admin has configured
    // server-side, rather than the hardcoded fallback, so a new user's very first impression is
    // intentional.
    if (colorValue == null && modeStr == null) {
      _loadServerDefaults();
      return const AppThemeState();
    }

    return AppThemeState(
      seedColor: colorValue != null ? Color(colorValue) : DesignTokens.primary,
      themeMode: switch (modeStr) {
        'light' => ThemeMode.light,
        'dark' => ThemeMode.dark,
        _ => ThemeMode.system,
      },
    );
  }

  Future<void> _loadServerDefaults() async {
    try {
      final settings = await ref.read(appSettingsRepositoryProvider).get();
      state = AppThemeState(
        seedColor: _parseHexColor(settings.defaultSeedColor) ?? state.seedColor,
        themeMode: _parseThemeMode(settings.defaultThemeMode),
      );
    } catch (_) {
      // Offline on first launch — keep the built-in AppThemeState() default.
    }
  }

  Color? _parseHexColor(String hex) {
    final cleaned = hex.replaceFirst('#', '');
    final value = int.tryParse(cleaned, radix: 16);
    return value == null ? null : Color(0xFF000000 | value);
  }

  ThemeMode _parseThemeMode(String mode) => switch (mode) {
        'DARK' => ThemeMode.dark,
        'SYSTEM' => ThemeMode.system,
        _ => ThemeMode.light,
      };

  Future<void> setSeedColor(Color color) async {
    state = state.copyWith(seedColor: color);
    await ref.read(sharedPreferencesProvider).setInt(_kSeedColorKey, color.toARGB32());
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = state.copyWith(themeMode: mode);
    final modeStr = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      _ => 'system',
    };
    await ref.read(sharedPreferencesProvider).setString(_kThemeModeKey, modeStr);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final themeProvider = NotifierProvider<ThemeNotifier, AppThemeState>(ThemeNotifier.new);
