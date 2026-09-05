package uz.ishchi.app.settings;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.settings.dto.AppSettingsResponse;
import uz.ishchi.app.settings.dto.AppSettingsUpdateRequest;
import uz.ishchi.app.telegram.TelegramClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AppSettingsService {

    private final AppSettingsRepository appSettingsRepository;
    private final TelegramClient telegramClient;

    @Value("${app.base-url}")
    private String baseUrl;

    @Transactional(readOnly = true)
    public AppSettingsResponse get() {
        return toResponse(load());
    }

    @Transactional
    public AppSettingsResponse update(AppSettingsUpdateRequest request) {
        AppSettings settings = load();
        Boolean walletEnabled = request.walletEnabled();
        String telegramBotToken = request.telegramBotToken();
        if (walletEnabled != null) settings.setWalletEnabled(walletEnabled);
        if (request.supportPhone() != null) settings.setSupportPhone(request.supportPhone());
        if (request.supportEmail() != null) settings.setSupportEmail(request.supportEmail());
        if (request.supportTelegram() != null) settings.setSupportTelegram(request.supportTelegram());
        if (request.aboutText() != null) settings.setAboutText(request.aboutText());
        if (request.jobPostingFeeEnabled() != null) settings.setJobPostingFeeEnabled(request.jobPostingFeeEnabled());
        if (request.jobPostingFee() != null) settings.setJobPostingFee(request.jobPostingFee());
        if (request.jobViewFeeEnabled() != null) settings.setJobViewFeeEnabled(request.jobViewFeeEnabled());
        if (request.jobViewFee() != null) settings.setJobViewFee(request.jobViewFee());
        if (request.defaultThemeMode() != null) settings.setDefaultThemeMode(request.defaultThemeMode());
        if (request.defaultSeedColor() != null) settings.setDefaultSeedColor(request.defaultSeedColor());

        if (telegramBotToken != null) {
            if (telegramBotToken.isBlank()) {
                if (settings.getTelegramBotToken() != null) {
                    telegramClient.deleteWebhook(settings.getTelegramBotToken());
                }
                settings.setTelegramBotToken(null);
                settings.setTelegramBotUsername(null);
            } else {
                TelegramClient.BotIdentity identity = telegramClient.getMe(telegramBotToken);
                if (!identity.ok()) {
                    throw ApiException.badRequest("Telegram bot tokeni noto'g'ri yoki botga ulanib bo'lmadi");
                }
                settings.setTelegramBotToken(telegramBotToken);
                settings.setTelegramBotUsername(identity.username());
                String webhookUrl = baseUrl + "/api/telegram/webhook/" + webhookSecret(telegramBotToken);
                boolean webhookOk = telegramClient.setWebhook(telegramBotToken, webhookUrl, webhookSecret(telegramBotToken));
                if (!webhookOk) {
                    throw ApiException.badRequest("Bot tokeni to'g'ri, lekin webhook o'rnatilmadi. Qaytadan urinib ko'ring");
                }
            }
        }
        return toResponse(settings);
    }

    /** Raw token for internal use only (sending messages) — never exposed via the API response. */
    public String getTelegramBotToken() {
        return load().getTelegramBotToken();
    }

    public String getTelegramBotUsername() {
        return load().getTelegramBotUsername();
    }

    public boolean isTelegramConfigured() {
        AppSettings s = load();
        return s.getTelegramBotToken() != null && s.getTelegramBotUsername() != null;
    }

    /** Raw settings row for internal use by services that need to check paid-feature config. */
    public AppSettings getRaw() {
        return load();
    }

    public static String webhookSecret(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed).substring(0, 32);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private AppSettings load() {
        return appSettingsRepository.findById(1L).orElseGet(() -> {
            AppSettings fresh = new AppSettings();
            return appSettingsRepository.save(fresh);
        });
    }

    private AppSettingsResponse toResponse(AppSettings s) {
        return new AppSettingsResponse(
                s.isWalletEnabled(),
                s.getTelegramBotToken() != null,
                s.getTelegramBotUsername(),
                s.getSupportPhone(),
                s.getSupportEmail(),
                s.getSupportTelegram(),
                s.getAboutText(),
                s.isJobPostingFeeEnabled(),
                s.getJobPostingFee(),
                s.isJobViewFeeEnabled(),
                s.getJobViewFee(),
                s.getDefaultThemeMode(),
                s.getDefaultSeedColor()
        );
    }
}
