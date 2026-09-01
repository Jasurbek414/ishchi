package uz.ishchi.app.profile.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import uz.ishchi.app.common.WorkPreference;

import java.util.List;

public record ProfileUpdateRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        Long regionId,
        Long districtId,
        @Size(max = 2000) String about,
        @Min(0) @Max(70) Integer experienceYears,
        Boolean available,
        List<Long> professionIds,
        Double latitude,
        Double longitude,
        WorkPreference workPreference,
        Boolean hasDriverLicense,
        @Size(max = 50) String driverLicenseCategories
) {
}
