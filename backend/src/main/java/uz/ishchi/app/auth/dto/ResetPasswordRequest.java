package uz.ishchi.app.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank @Pattern(regexp = "^\\+998\\d{9}$") String phone,
        @NotBlank String code,
        @NotBlank @Size(min = 6, max = 100) String newPassword
) {
}
