package uz.ishchi.app.settings.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * {@code telegramBotToken}: {@code null} leaves it unchanged, {@code ""} clears/disables it,
 * any other value replaces it (and is validated + wired up to a webhook). The support/about
 * fields are plain optional overwrites — {@code null} leaves each unchanged. Same for the
 * paid-service toggles/fees and the default-theme fields: {@code null} leaves each unchanged.
 * {@code mapTileUrl}/{@code mapAttribution}: {@code null} leaves unchanged, {@code ""} goes back to
 * the app's built-in map.
 */
public record AppSettingsUpdateRequest(
        Boolean walletEnabled,
        String telegramBotToken,
        @Size(max = 20) String supportPhone,
        @Size(max = 200) String supportEmail,
        @Size(max = 100) String supportTelegram,
        @Size(max = 4000) String aboutText,
        Boolean jobPostingFeeEnabled,
        @DecimalMin(value = "0", message = "Narx manfiy bo'lishi mumkin emas") BigDecimal jobPostingFee,
        Boolean jobViewFeeEnabled,
        @DecimalMin(value = "0", message = "Narx manfiy bo'lishi mumkin emas") BigDecimal jobViewFee,
        @Pattern(regexp = "LIGHT|DARK|SYSTEM", message = "Mavzu rejimi LIGHT, DARK yoki SYSTEM bo'lishi kerak")
        String defaultThemeMode,
        @Pattern(regexp = "#[0-9A-Fa-f]{6}", message = "Rang #RRGGBB formatida bo'lishi kerak")
        String defaultSeedColor,
        @Size(max = 500)
        @Pattern(regexp = "|(?=\\S*\\{z\\})(?=\\S*\\{x\\})(?=\\S*\\{y\\})https://\\S+",
                message = "Xarita manzili https:// bilan boshlanib, {z}, {x} va {y} ni o'z ichiga olishi kerak")
        String mapTileUrl,
        @Size(max = 200) String mapAttribution
) {
}
