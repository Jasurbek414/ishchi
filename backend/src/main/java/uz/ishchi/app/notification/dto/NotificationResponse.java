package uz.ishchi.app.notification.dto;

import uz.ishchi.app.notification.AppNotification;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String title,
        String body,
        String type,
        boolean isRead,
        Instant createdAt
) {
    public static NotificationResponse from(AppNotification n) {
        return new NotificationResponse(
                n.getId(),
                n.getTitle(),
                n.getBody(),
                n.getType(),
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
