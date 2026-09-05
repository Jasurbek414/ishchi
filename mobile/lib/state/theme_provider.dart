import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'core_providers.dart';

// ─── Mavzu holati ────────────────────────────────────────────────────────────

class AppThemeState {
  const AppThemeState({
    this.seedColor = const Color(0xFFE8541F),
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
  @override
  AppThemeState build() {
    _loadFromPrefs();
    return const AppThemeState();
  }

  Future<void> _loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final colorValue = prefs.getInt(_kSeedColorKey);
    final modeStr = prefs.getString(_kThemeModeKey);

    // No local choice saved yet — this is a fresh install (or first launch after an
    // update). Use whatever default the admin has configured server-side, rather than
    // the hardcoded fallback, so a new user's very first impression is intentional.
    if (colorValue == null && modeStr == null) {
      try {
        final settings = await ref.read(appSettingsRepositoryProvider).get();
        state = AppThemeState(
          seedColor: _parseHexColor(settings.defaultSeedColor) ?? state.seedColor,
          themeMode: _parseThemeMode(settings.defaultThemeMode),
        );
      } catch (_) {
        // Offline on first launch — keep the built-in AppThemeState() default.
      }
      return;
    }

    final color = colorValue != null ? Color(colorValue) : const Color(0xFFE8541F);
    final mode = switch (modeStr) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };

    state = AppThemeState(seedColor: color, themeMode: mode);
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
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_kSeedColorKey, color.toARGB32());
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = state.copyWith(themeMode: mode);
    final prefs = await SharedPreferences.getInstance();
    final modeStr = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      _ => 'system',
    };
    await prefs.setString(_kThemeModeKey, modeStr);
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

final themeProvider = NotifierProvider<ThemeNotifier, AppThemeState>(ThemeNotifier.new);
