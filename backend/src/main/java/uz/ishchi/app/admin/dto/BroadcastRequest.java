package uz.ishchi.app.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import uz.ishchi.app.common.Role;

public record BroadcastRequest(
        @NotBlank @Size(max = 100) String title,
        @NotBlank @Size(max = 500) String body,
        Role role,
        Long regionId
) {
}
