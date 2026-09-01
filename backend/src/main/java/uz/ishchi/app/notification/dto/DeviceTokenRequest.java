package uz.ishchi.app.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import uz.ishchi.app.common.DevicePlatform;

public record DeviceTokenRequest(
        @NotBlank String token,
        @NotNull DevicePlatform platform
) {
}
