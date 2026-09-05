package uz.ishchi.app.landing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uz.ishchi.app.common.LandingItemType;

public record LandingItemRequest(
        @NotNull LandingItemType type,
        @NotBlank @Size(max = 150) String title,
        @NotBlank @Size(max = 500) String description,
        Integer sortOrder
) {
}
