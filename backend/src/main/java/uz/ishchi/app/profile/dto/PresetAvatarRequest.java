package uz.ishchi.app.profile.dto;

import jakarta.validation.constraints.NotBlank;

public record PresetAvatarRequest(
        @NotBlank(message = "Avatar tanlanishi shart")
        String avatarUrl
) {
}
