package uz.ishchi.app.telegram;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.auth.AuthService;
import uz.ishchi.app.telegram.dto.TelegramUpdate;

@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final TelegramService telegramService;
    private final AuthService authService;

    /**
     * The shared secret arrives in the header Telegram sets from {@code setWebhook}, not in the URL
     * path. It used to be a path variable, which put it in every proxy and web-server access log.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "X-Telegram-Bot-Api-Secret-Token", required = false) String secret,
            @RequestBody TelegramUpdate update) {
        telegramService.handleWebhookUpdate(secret, update)
                .ifPresent(linked -> authService.sendPendingOtpAfterTelegramLink(linked.user(), linked.pendingPurpose()));
        // Always 200: Telegram retries on anything else, and a rejected secret is not worth a retry.
        return ResponseEntity.ok().build();
    }
}
