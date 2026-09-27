package uz.ishchi.app.settings;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.TelegramTokenCipher;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.settings.dto.AppSettingsResponse;
import uz.ishchi.app.settings.dto.AppSettingsUpdateRequest;
import uz.ishchi.app.telegram.TelegramClient;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AppSettingsService {

    private static final Logger log = LoggerFactory.getLogger(AppSettingsService.class);

    private final AppSettingsRepository appSettingsRepository;
    private final TelegramClient telegramClient;
    private final TelegramTokenCipher telegramTokenCipher;

    private static final SecureRandom RANDOM = new SecureRandom();

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
                    telegramClient.deleteWebhook(telegramTokenCipher.decrypt(settings.getTelegramBotToken()));
                }
                settings.setTelegramBotToken(null);
                settings.setTelegramBotUsername(null);
                settings.setTelegramWebhookSecret(null);
            } else {
                TelegramClient.BotIdentity identity = telegramClient.getMe(telegramBotToken);
                if (!identity.ok()) {
                    throw ApiException.badRequest("Telegram bot tokeni noto'g'ri yoki botga ulanib bo'lmadi");
                }
                settings.setTelegramBotToken(telegramTokenCipher.encrypt(telegramBotToken));
                settings.setTelegramBotUsername(identity.username());
                String secret = generateWebhookSecret();
                settings.setTelegramWebhookSecret(secret);
                boolean webhookOk = telegramClient.setWebhook(telegramBotToken, webhookUrl(), secret);
                if (!webhookOk) {
                    throw ApiException.badRequest("Bot tokeni to'g'ri, lekin webhook o'rnatilmadi. Qaytadan urinib ko'ring");
                }
            }
        }
        return toResponse(settings);
    }

    /** Raw token for internal use only (sending messages) — never exposed via the API response. */
    public String getTelegramBotToken() {
        return telegramTokenCipher.decrypt(load().getTelegramBotToken());
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

    /** The one URL Telegram posts to; the secret no longer rides in the path. */
    public String webhookUrl() {
        return baseUrl + "/api/telegram/webhook";
    }

    /**
     * Checks the secret Telegram echoes back in {@code X-Telegram-Bot-Api-Secret-Token}. Compared
     * in constant time so a mismatch cannot be narrowed down by timing.
     */
    public boolean matchesWebhookSecret(String presented) {
        String expected = load().getTelegramWebhookSecret();
        if (expected == null || presented == null) {
            return false;
        }
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                presented.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Re-registers the webhook with the URL and secret this deployment expects. Called on startup
     * so an instance that was configured before the secret moved out of the URL heals itself
     * instead of silently receiving nothing.
     */
    @Transactional
    public void ensureWebhookRegistered() {
        AppSettings settings = load();
        String token = telegramTokenCipher.decrypt(settings.getTelegramBotToken());
        if (token == null || token.isBlank()) {
            return;
        }
        if (settings.getTelegramWebhookSecret() == null) {
            settings.setTelegramWebhookSecret(generateWebhookSecret());
        }
        if (!telegramClient.setWebhook(token, webhookUrl(), settings.getTelegramWebhookSecret())) {
            log.warn("Telegram webhook'ni o'rnatib bo'lmadi ({}) — admin panelda bot tokenini qayta saqlang",
                    webhookUrl());
        }
    }

    private String generateWebhookSecret() {
        byte[] bytes = new byte[24];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
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
