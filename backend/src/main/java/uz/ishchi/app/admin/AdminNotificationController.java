package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.admin.dto.BroadcastRequest;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.telegram.TelegramService;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final TelegramService telegramService;
    private final UserRepository userRepository;

    @PostMapping("/broadcast")
    public void broadcast(@Valid @RequestBody BroadcastRequest request) {
        notificationService.broadcast(request.role(), request.regionId(), request.title(), request.body());
    }

    @PostMapping("/telegram-broadcast")
    public void telegramBroadcast(@Valid @RequestBody BroadcastRequest request) {
        telegramService.broadcast(request.role(), request.regionId(), request.title(), request.body());
    }

    @PostMapping("/send-to-user")
    public Map<String, Object> sendToUser(@RequestParam String phone,
                                          @RequestParam String title,
                                          @RequestParam String body,
                                          @RequestParam(required = false, defaultValue = "SYSTEM") String type) {
        String normalizedPhone = phone.trim();
        if (!normalizedPhone.startsWith("+")) {
            normalizedPhone = "+998" + (normalizedPhone.startsWith("998") ? normalizedPhone.substring(3) : normalizedPhone);
        }
        User user = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi: " + phone));
        notificationService.sendToUser(user, title, body, type, Map.of(
                "type", type.toLowerCase(),
                "title", title,
                "body", body
        ));
        return Map.of("success", true, "userId", user.getId(), "phone", user.getPhone());
    }
}
