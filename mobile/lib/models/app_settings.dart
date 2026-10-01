class AppSettings {
  const AppSettings({
    required this.walletEnabled,
    this.supportPhone,
    this.supportEmail,
    this.supportTelegram,
    this.aboutText,
    this.jobPostingFeeEnabled = false,
    this.jobPostingFee = 0,
    this.jobViewFeeEnabled = false,
    this.jobViewFee = 0,
    this.defaultThemeMode = 'LIGHT',
    this.defaultSeedColor = '#0284C7',
    this.mapTileUrl,
    this.mapAttribution,
  });

  final bool walletEnabled;
  final String? supportPhone;
  final String? supportEmail;
  final String? supportTelegram;
  final String? aboutText;
  final bool jobPostingFeeEnabled;
  final num jobPostingFee;
  final bool jobViewFeeEnabled;
  final num jobViewFee;
  final String defaultThemeMode;
  final String defaultSeedColor;

  /// Tile URL template the admin chose for the maps; null means the built-in OpenStreetMap tiles.
  final String? mapTileUrl;
  final String? mapAttribution;

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
        walletEnabled: json['walletEnabled'] as bool? ?? false,
        supportPhone: json['supportPhone'] as String?,
        supportEmail: json['supportEmail'] as String?,
        supportTelegram: json['supportTelegram'] as String?,
        aboutText: json['aboutText'] as String?,
        jobPostingFeeEnabled: json['jobPostingFeeEnabled'] as bool? ?? false,
        jobPostingFee: json['jobPostingFee'] as num? ?? 0,
        jobViewFeeEnabled: json['jobViewFeeEnabled'] as bool? ?? false,
        jobViewFee: json['jobViewFee'] as num? ?? 0,
        defaultThemeMode: json['defaultThemeMode'] as String? ?? 'LIGHT',
        defaultSeedColor: json['defaultSeedColor'] as String? ?? '#0284C7',
        mapTileUrl: json['mapTileUrl'] as String?,
        mapAttribution: json['mapAttribution'] as String?,
      );
}
