/// Paths of the image assets bundled with the app (declared under `flutter: assets:` in
/// pubspec.yaml), kept in one place so a rename cannot leave a screen pointing at nothing.
abstract final class AppAssets {
  /// The brand logo, 1024×1024 on white — the app's only logo file; the launcher icons are
  /// generated from it too (flutter_launcher_icons in pubspec.yaml).
  static const logo = 'assets/icon/logo.png';
}
