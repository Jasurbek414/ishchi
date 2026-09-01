package uz.ishchi.app.telegram;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    @PostMapping("/webhook/{secret}")
    public ResponseEntity<Void> webhook(@PathVariable String secret, @RequestBody TelegramUpdate update) {
        telegramService.handleWebhookUpdate(secret, update)
                .ifPresent(linked -> authService.sendPendingOtpAfterTelegramLink(linked.user(), linked.pendingPurpose()));
        return ResponseEntity.ok().build();
    }
}
