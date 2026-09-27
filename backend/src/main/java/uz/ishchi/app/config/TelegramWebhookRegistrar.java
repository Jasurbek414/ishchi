package uz.ishchi.app.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import uz.ishchi.app.settings.AppSettingsService;

/**
 * Re-points the Telegram webhook at this deployment on startup.
 *
 * <p>The webhook URL used to carry the shared secret in its path. Moving the secret into the header
 * changes the URL, and a bot registered against the old one would simply stop delivering updates
 * until somebody re-saved the token in the admin panel. Re-registering here makes that automatic.
 */
@Component
@RequiredArgsConstructor
public class TelegramWebhookRegistrar {

    private static final Logger log = LoggerFactory.getLogger(TelegramWebhookRegistrar.class);

    private final AppSettingsService appSettingsService;

    @EventListener(ApplicationReadyEvent.class)
    public void registerWebhook() {
        try {
            appSettingsService.ensureWebhookRegistered();
        } catch (RuntimeException e) {
            // Never stop the application from serving traffic over this.
            log.warn("Startup'da Telegram webhook'ni o'rnatib bo'lmadi", e);
        }
    }
}
