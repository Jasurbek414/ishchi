package uz.ishchi.app.notification;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.notification.dto.DeviceTokenRequest;
import uz.ishchi.app.notification.dto.NotificationResponse;
import uz.ishchi.app.notification.dto.UnregisterTokenRequest;
import uz.ishchi.app.security.UserPrincipal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> getNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return notificationService.getUserNotifications(principal.getUser(), page, size);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return Map.of("unreadCount", notificationService.getUnreadCount(principal.getUser()));
    }

    @PostMapping("/{id}/read")
    public void markAsRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        notificationService.markAsRead(principal.getUser(), id);
    }

    @PostMapping("/read-all")
    public void markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getUser());
    }

    @DeleteMapping("/{id}")
    public void deleteNotification(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        notificationService.deleteNotification(principal.getUser(), id);
    }

    @DeleteMapping
    public void clearAll(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.clearAll(principal.getUser());
    }

    @PostMapping("/device-token")
    public void registerToken(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody DeviceTokenRequest request) {
        notificationService.registerToken(principal.getUser(), request.token(), request.platform());
    }

    @DeleteMapping("/device-token")
    public void unregisterToken(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody UnregisterTokenRequest request) {
        notificationService.unregisterToken(principal.getUser(), request.token());
    }
}
