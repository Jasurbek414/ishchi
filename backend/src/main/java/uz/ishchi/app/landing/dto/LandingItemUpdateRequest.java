package uz.ishchi.app.landing.dto;

import jakarta.validation.constraints.Size;

public record LandingItemUpdateRequest(
        @Size(max = 150) String title,
        @Size(max = 500) String description,
        Integer sortOrder
) {
}
