package uz.ishchi.app.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Changes the signed-in admin's login. {@code currentPassword} is always required; {@code phone}
 * and {@code newPassword} are each optional, null or blank leaving that one as it is.
 */
public record AdminAccountUpdateRequest(
        @NotBlank(message = "Joriy parolni kiriting") String currentPassword,
        @Pattern(regexp = "|\\+998\\d{9}", message = "Telefon +998XXXXXXXXX ko'rinishida bo'lishi kerak") String phone,
        @Size(max = 100, message = "Parol 100 belgidan oshmasin") String newPassword
) {
}
