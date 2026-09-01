package uz.ishchi.app.admin.dto;

import uz.ishchi.app.common.Role;
import uz.ishchi.app.user.User;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String phone,
        Role role,
        boolean active,
        boolean verified,
        boolean telegramLinked,
        String fullName,
        String regionName,
        Instant createdAt
) {
    public static AdminUserResponse from(User user, String fullName, String regionName) {
        return new AdminUserResponse(user.getId(), user.getPhone(), user.getRole(),
                user.isActive(), user.isVerified(), user.getTelegramChatId() != null,
                fullName, regionName, user.getCreatedAt());
    }
}
