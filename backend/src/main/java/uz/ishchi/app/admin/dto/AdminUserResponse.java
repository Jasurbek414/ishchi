package uz.ishchi.app.admin.dto;

import uz.ishchi.app.common.Role;
import uz.ishchi.app.user.User;

import java.time.Instant;

public record AdminUserResponse(
        Long id,
        String phone,
        Role role,
        boolean active,
        /** Phone confirmed by OTP — distinct from {@link #workerVerified}. */
        boolean verified,
        boolean telegramLinked,
        String fullName,
        String regionName,
        Instant createdAt,
        /** Documents checked by an admin. Only meaningful for a worker; false where there is no
         *  worker profile. Deliberately a separate flag from the OTP one above. */
        boolean workerVerified,
        Double ratingAverage,
        Integer ratingCount,
        String districtName,
        String avatarUrl
) {
    public static AdminUserResponse from(User user, String fullName, String regionName) {
        return from(user, fullName, regionName, null, null, false, null, null);
    }

    public static AdminUserResponse from(User user, String fullName, String regionName, String districtName,
                                          String avatarUrl, boolean workerVerified, Double ratingAverage,
                                          Integer ratingCount) {
        return new AdminUserResponse(user.getId(), user.getPhone(), user.getRole(),
                user.isActive(), user.isVerified(), user.getTelegramChatId() != null,
                fullName, regionName, user.getCreatedAt(),
                workerVerified, ratingAverage, ratingCount, districtName, avatarUrl);
    }
}
