package uz.ishchi.app.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Changing a password from inside the app proves you know the current one. Before this the only
 * route was the public forgot-password flow, so anyone holding an unlocked phone with the linked
 * Telegram on it could take the account over without knowing the password at all.
 */
public record ChangePasswordRequest(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 6, max = 100) String newPassword
) {
}
