package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.admin.dto.BroadcastRequest;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.telegram.TelegramService;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final TelegramService telegramService;

    @PostMapping("/broadcast")
    public void broadcast(@Valid @RequestBody BroadcastRequest request) {
        notificationService.broadcast(request.role(), request.regionId(), request.title(), request.body());
    }

    @PostMapping("/telegram-broadcast")
    public void telegramBroadcast(@Valid @RequestBody BroadcastRequest request) {
        telegramService.broadcast(request.role(), request.regionId(), request.title(), request.body());
    }
}
