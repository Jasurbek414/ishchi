package uz.ishchi.app.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PhoneRequest(
        @NotBlank @Pattern(regexp = "^\\+998\\d{9}$") String phone
) {
}
