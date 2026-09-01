package uz.ishchi.app.auth.dto;

import uz.ishchi.app.common.Role;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        Long userId,
        Role role
) {
}
