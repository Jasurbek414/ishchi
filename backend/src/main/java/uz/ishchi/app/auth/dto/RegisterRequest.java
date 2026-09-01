package uz.ishchi.app.auth.dto;

import jakarta.validation.constraints.*;
import uz.ishchi.app.common.Role;

public record RegisterRequest(
        @NotBlank @Pattern(regexp = "^\\+998\\d{9}$", message = "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak")
        String phone,

        @NotBlank @Size(min = 6, max = 100)
        String password,

        @NotBlank @Size(max = 100)
        String firstName,

        @NotBlank @Size(max = 100)
        String lastName,

        @NotNull
        Role role,

        @NotNull
        Long regionId,

        @NotNull
        Long districtId
) {
}
