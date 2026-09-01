package uz.ishchi.app.worker.dto;

import uz.ishchi.app.common.WorkPreference;
import uz.ishchi.app.profession.dto.ProfessionResponse;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.dto.WorkExperienceResponse;

import java.util.List;

public record WorkerResponse(
        Long id,
        Long userId,
        String firstName,
        String lastName,
        String avatarUrl,
        String phone,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        Integer experienceYears,
        String about,
        boolean available,
        List<ProfessionResponse> professions,
        Double latitude,
        Double longitude,
        WorkPreference workPreference,
        boolean hasDriverLicense,
        String driverLicenseCategories,
        List<WorkExperienceResponse> experiences
) {
    /** For list/search results — omits work experience to avoid an extra query per row. */
    public static WorkerResponse from(WorkerProfile p) {
        return from(p, null);
    }

    /** For the single-worker detail view. */
    public static WorkerResponse from(WorkerProfile p, List<WorkExperienceResponse> experiences) {
        return new WorkerResponse(
                p.getId(),
                p.getUser().getId(),
                p.getFirstName(),
                p.getLastName(),
                p.getAvatarUrl(),
                p.getUser().getPhone(),
                p.getRegion().getId(),
                p.getRegion().getName(),
                p.getDistrict().getId(),
                p.getDistrict().getName(),
                p.getExperienceYears(),
                p.getAbout(),
                p.isAvailable(),
                p.getProfessions().stream().map(ProfessionResponse::from).toList(),
                p.getLatitude(),
                p.getLongitude(),
                p.getWorkPreference(),
                p.isHasDriverLicense(),
                p.getDriverLicenseCategories(),
                experiences
        );
    }
}
