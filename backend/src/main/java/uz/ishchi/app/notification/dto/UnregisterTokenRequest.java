package uz.ishchi.app.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record UnregisterTokenRequest(@NotBlank String token) {
}
