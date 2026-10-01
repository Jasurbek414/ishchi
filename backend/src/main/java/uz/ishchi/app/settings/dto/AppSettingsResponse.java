package uz.ishchi.app.settings.dto;

import java.math.BigDecimal;

public record AppSettingsResponse(
        boolean walletEnabled,
        boolean telegramConfigured,
        String telegramBotUsername,
        String supportPhone,
        String supportEmail,
        String supportTelegram,
        String aboutText,
        boolean jobPostingFeeEnabled,
        BigDecimal jobPostingFee,
        boolean jobViewFeeEnabled,
        BigDecimal jobViewFee,
        String defaultThemeMode,
        String defaultSeedColor,
        String mapTileUrl,
        String mapAttribution
) {
}
