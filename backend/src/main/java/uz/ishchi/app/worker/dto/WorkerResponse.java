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
    /**
     * Contact details are deliberately withheld from every bulk response. Handing out a phone
     * number and exact coordinates per row let any single account page through the whole worker
     * table and walk away with names, numbers and home locations. They are served only by the
     * single-worker detail endpoint, one worker at a time.
     *
     * <p>The field stays present and blank rather than null on purpose: the mobile client parses
     * it as a non-nullable String, so a null would crash a released app mid-list.
     */
    private static final String WITHHELD = "";

    /** List/search results: no contact details, no coordinates, no work experience. */
    public static WorkerResponse forList(WorkerProfile p) {
        return build(p, WITHHELD, null, null, null);
    }

    /** Map pins: coordinates are the whole point, but contact details still are not. */
    public static WorkerResponse forMap(WorkerProfile p) {
        return build(p, WITHHELD, p.getLatitude(), p.getLongitude(), null);
    }

    /** The single-worker detail view an employer opens — the one place the phone is served. */
    public static WorkerResponse forDetail(WorkerProfile p, List<WorkExperienceResponse> experiences) {
        return build(p, p.getUser().getPhone(), p.getLatitude(), p.getLongitude(), experiences);
    }

    private static WorkerResponse build(WorkerProfile p, String phone, Double latitude, Double longitude,
                                         List<WorkExperienceResponse> experiences) {
        return new WorkerResponse(
                p.getId(),
                p.getUser().getId(),
                p.getFirstName(),
                p.getLastName(),
                p.getAvatarUrl(),
                phone,
                p.getRegion().getId(),
                p.getRegion().getName(),
                p.getDistrict().getId(),
                p.getDistrict().getName(),
                p.getExperienceYears(),
                p.getAbout(),
                p.isAvailable(),
                p.getProfessions().stream().map(ProfessionResponse::from).toList(),
                latitude,
                longitude,
                p.getWorkPreference(),
                p.isHasDriverLicense(),
                p.getDriverLicenseCategories(),
                experiences
        );
    }
}
