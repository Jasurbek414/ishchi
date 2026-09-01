package uz.ishchi.app.profile.dto;

import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.WorkPreference;
import uz.ishchi.app.profession.dto.ProfessionResponse;

import java.util.List;

public record ProfileResponse(
        Long userId,
        String phone,
        Role role,
        String firstName,
        String lastName,
        String avatarUrl,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        String about,
        Integer experienceYears,
        Boolean available,
        List<ProfessionResponse> professions,
        Double latitude,
        Double longitude,
        WorkPreference workPreference,
        Boolean hasDriverLicense,
        String driverLicenseCategories,
        List<WorkExperienceResponse> experiences
) {
}
