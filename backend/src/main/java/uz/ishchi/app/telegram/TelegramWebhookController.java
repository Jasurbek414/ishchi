package uz.ishchi.app.telegram;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.auth.AuthService;
import uz.ishchi.app.telegram.dto.TelegramUpdate;

@Slf4j
@RestController
@RequestMapping("/api/telegram")
@RequiredArgsConstructor
public class TelegramWebhookController {

    private final TelegramService telegramService;
    private final AuthService authService;

    @PostMapping("/webhook/{secret}")
    public ResponseEntity<Void> webhook(@PathVariable String secret, @RequestBody TelegramUpdate update) {
        // Telegram redelivers an update until the webhook answers 2xx. Letting an exception
        // escape therefore turns one bad update into an endless loop that re-sends every reply
        // the handler produced before it failed, so failures are logged and acknowledged
        // instead. The user simply doesn't get a response to that one message.
        try {
            telegramService.handleWebhookUpdate(secret, update)
                    .ifPresent(linked -> authService.sendPendingOtpAfterTelegramLink(linked.user(), linked.pendingPurpose()));
        } catch (RuntimeException e) {
            log.error("Telegram webhook update could not be processed", e);
        }
        return ResponseEntity.ok().build();
    }
}
