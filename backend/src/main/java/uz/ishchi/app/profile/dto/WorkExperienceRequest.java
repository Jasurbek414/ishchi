package uz.ishchi.app.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record WorkExperienceRequest(
        @NotBlank @Size(max = 150) String companyName,
        @NotBlank @Size(max = 150) String positionTitle,
        @Size(max = 1000) String description,
        @NotNull LocalDate startDate,
        LocalDate endDate
) {
}
