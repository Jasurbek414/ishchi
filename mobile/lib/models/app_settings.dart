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
    this.defaultSeedColor = '#E8541F',
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
        defaultSeedColor: json['defaultSeedColor'] as String? ?? '#E8541F',
      );
}
