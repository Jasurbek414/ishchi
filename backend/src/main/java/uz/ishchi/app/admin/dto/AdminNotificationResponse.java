package uz.ishchi.app.admin.dto;

import uz.ishchi.app.notification.AppNotification;
import java.time.Instant;

public record AdminNotificationResponse(
        Long id,
        Long userId,
        String phone,
        String role,
        String title,
        String body,
        String type,
        boolean read,
        Instant createdAt
) {
    public static AdminNotificationResponse from(AppNotification n) {
        var u = n.getUser();
        return new AdminNotificationResponse(
                n.getId(),
                u != null ? u.getId() : null,
                u != null ? u.getPhone() : null,
                u != null && u.getRole() != null ? u.getRole().name() : null,
                n.getTitle(),
                n.getBody(),
                n.getType(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
