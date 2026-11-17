package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.admin.dto.AdminNotificationResponse;
import uz.ishchi.app.admin.dto.BroadcastRequest;
import uz.ishchi.app.common.dto.PageResponse;
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

    public record SendToUserRequest(
            String phone,
            String title,
            String body,
            String type
    ) {}

    @GetMapping("/recent")
    public PageResponse<AdminNotificationResponse> getRecent(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return PageResponse.of(notificationService.getRecentNotifications(pageable));
    }

    @PostMapping("/broadcast")
    public void broadcast(@Valid @RequestBody BroadcastRequest request) {
        notificationService.broadcast(request.role(), request.regionId(), request.title(), request.body());
    }

    @PostMapping("/telegram-broadcast")
    public void telegramBroadcast(@Valid @RequestBody BroadcastRequest request) {
        telegramService.broadcast(request.role(), request.regionId(), request.title(), request.body());
    }

    @PostMapping("/send-to-user")
    public Map<String, Object> sendToUser(@RequestBody(required = false) SendToUserRequest bodyRequest,
                                          @RequestParam(required = false) String phone,
                                          @RequestParam(required = false) String title,
                                          @RequestParam(required = false) String body,
                                          @RequestParam(required = false, defaultValue = "SYSTEM") String type) {
        String targetPhone = bodyRequest != null && bodyRequest.phone() != null ? bodyRequest.phone() : phone;
        String targetTitle = bodyRequest != null && bodyRequest.title() != null ? bodyRequest.title() : title;
        String targetBody = bodyRequest != null && bodyRequest.body() != null ? bodyRequest.body() : body;
        String targetType = bodyRequest != null && bodyRequest.type() != null ? bodyRequest.type() : (type != null ? type : "SYSTEM");

        if (targetPhone == null || targetPhone.isBlank()) {
            throw ApiException.badRequest("Telefon raqami kiritilishi shart");
        }
        if (targetTitle == null || targetTitle.isBlank()) {
            throw ApiException.badRequest("Sarlavha kiritilishi shart");
        }
        if (targetBody == null || targetBody.isBlank()) {
            throw ApiException.badRequest("Xabar matni kiritilishi shart");
        }

        String normalizedPhone = targetPhone.trim();
        if (!normalizedPhone.startsWith("+")) {
            normalizedPhone = "+998" + (normalizedPhone.startsWith("998") ? normalizedPhone.substring(3) : normalizedPhone);
        }
        User user = userRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi: " + targetPhone));
        notificationService.sendToUser(user, targetTitle, targetBody, targetType, Map.of(
                "type", targetType.toLowerCase(),
                "title", targetTitle,
                "body", targetBody
        ));
        return Map.of("success", true, "userId", user.getId(), "phone", user.getPhone());
    }
}
