import 'package:flutter/material.dart';

class AppColors {
  static const primary = Color(0xFFE8541F);
  static const primaryLight = Color(0xFFFF9A4D);
  static const surface = Color(0xFFFFFFFF);
  static const background = Color(0xFFF5F5F7);
  static const textPrimary = Color(0xFF1C1C1E);
  static const textSecondary = Color(0xFF6B6B70);
  static const border = Color(0xFFE2E2E5);
  static const success = Color(0xFF2E8B57);
  static const danger = Color(0xFFD64545);
}

extension AppColorHelpers on BuildContext {
  ColorScheme get cs => Theme.of(this).colorScheme;

  Color get themePrimary => cs.primary;
  Color get themePrimaryLight {
    final hsl = HSLColor.fromColor(cs.primary);
    return hsl.withLightness((hsl.lightness + 0.20).clamp(0.0, 1.0)).toColor();
  }
  Color get themeTextPrimary => cs.onSurface;
  Color get themeTextSecondary => cs.onSurfaceVariant;
  Color get themeDanger => cs.error;

  /// AppColors.success is tuned for a white background; on a dark surface it drops to roughly
  /// 3.4:1, which is under the 4.5:1 that small text needs. Lightened for dark mode so "available",
  /// "credited" and similar states stay readable in both themes.
  Color get themeSuccess {
    if (Theme.of(this).brightness == Brightness.light) return AppColors.success;
    final hsl = HSLColor.fromColor(AppColors.success);
    return hsl.withLightness((hsl.lightness + 0.22).clamp(0.0, 1.0)).withSaturation(0.55).toColor();
  }
  Color get themeOnSurface => cs.onSurface;
  Color get themeOnSurfaceVariant => cs.onSurfaceVariant;
}

/// Picks black or white — whichever reads clearly on top of [background] — rather
/// than a fixed color, since a user-picked seed color can be light or dark.
Color _readableOn(Color background) {
  return ThemeData.estimateBrightnessForColor(background) == Brightness.dark
      ? Colors.white
      : Colors.black;
}

class AppTheme {
  static ThemeData light([Color? seed]) => _build(Brightness.light, seed);

  static ThemeData dark([Color? seed]) => _build(Brightness.dark, seed);

  /// Light and dark used to be two ~100-line copies of each other, differing only in the three
  /// container colours below — so every radius or padding tweak had to be made twice, and a change
  /// applied to one theme but not the other would go unnoticed.
  static ThemeData _build(Brightness brightness, Color? seed) {
    final isDark = brightness == Brightness.dark;
    final seedColor = seed ?? AppColors.primary;

    // ColorScheme.fromSeed() picks its own tone for `primary` from the seed's hue — often a visibly
    // different shade than what the user actually tapped. We keep its harmonious surface/error/etc.
    // tones but pin primary to the exact picked color.
    final base = ColorScheme.fromSeed(seedColor: seedColor, brightness: brightness);
    final primaryContainer = isDark
        ? Color.lerp(seedColor, Colors.black, 0.55)!
        : Color.lerp(seedColor, Colors.white, 0.82)!;
    final colorScheme = base.copyWith(
      primary: seedColor,
      onPrimary: _readableOn(seedColor),
      primaryContainer: primaryContainer,
      // Derived from the container rather than fixed: dark mode used a hard-coded white, which
      // disappeared against the container a light seed colour (a yellow, say) produces.
      onPrimaryContainer: _readableOn(primaryContainer),
    );

    final elevatedSurface = isDark ? colorScheme.surfaceContainer : colorScheme.surface;
    final chipSurface = isDark ? colorScheme.surfaceContainer : colorScheme.surfaceContainerLowest;

    final buttonShape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusControl));
    const buttonTextStyle = TextStyle(fontSize: 16, fontWeight: FontWeight.w600);

    OutlineInputBorder inputBorder(Color color, [double width = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(_radiusControl),
          borderSide: BorderSide(color: color, width: width),
        );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: colorScheme.surfaceContainerLowest,
      appBarTheme: AppBarTheme(
        backgroundColor: colorScheme.surfaceContainerLowest,
        foregroundColor: colorScheme.onSurface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: colorScheme.onSurface,
          fontSize: 20,
          fontWeight: FontWeight.w700,
        ),
      ),
      cardTheme: CardThemeData(
        color: elevatedSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_radiusCard),
          side: BorderSide(color: colorScheme.outlineVariant),
        ),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: colorScheme.primary,
          foregroundColor: colorScheme.onPrimary,
          minimumSize: const Size.fromHeight(_controlHeight),
          shape: buttonShape,
          textStyle: buttonTextStyle,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: colorScheme.primary,
          side: BorderSide(color: colorScheme.primary),
          minimumSize: const Size.fromHeight(_controlHeight),
          shape: buttonShape,
          textStyle: buttonTextStyle,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: elevatedSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: inputBorder(colorScheme.outlineVariant),
        enabledBorder: inputBorder(colorScheme.outlineVariant),
        focusedBorder: inputBorder(colorScheme.primary, 1.5),
        errorBorder: inputBorder(colorScheme.error),
        focusedErrorBorder: inputBorder(colorScheme.error, 1.5),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: chipSurface,
        selectedColor: colorScheme.primaryContainer,
        labelStyle: TextStyle(color: colorScheme.onSurface),
        side: BorderSide(color: colorScheme.outlineVariant),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusChip)),
      ),
      dividerTheme: DividerThemeData(color: colorScheme.outlineVariant, thickness: 1),
    );
  }

  /// Shared shape and sizing so light and dark can never drift apart.
  static const _radiusCard = 16.0;
  static const _radiusControl = 14.0;
  static const _radiusChip = 10.0;
  static const _controlHeight = 52.0;
}
