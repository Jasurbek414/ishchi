package uz.ishchi.app.settings.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * {@code telegramBotToken}: {@code null} leaves it unchanged, {@code ""} clears/disables it,
 * any other value replaces it (and is validated + wired up to a webhook). The support/about
 * fields are plain optional overwrites — {@code null} leaves each unchanged. Same for the
 * paid-service toggles/fees: {@code null} leaves each unchanged.
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
        @DecimalMin(value = "0", message = "Narx manfiy bo'lishi mumkin emas") BigDecimal jobViewFee
) {
}
