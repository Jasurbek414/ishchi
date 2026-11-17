package uz.ishchi.app.telephony.dto;

import uz.ishchi.app.profile.WorkerProfile;

import java.util.List;

public record AvailableWorkerDto(
        Long id,
        Long userId,
        String fullName,
        String phone,
        String avatarUrl,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        Integer experienceYears,
        boolean available,
        Double latitude,
        Double longitude,
        List<String> professions
) {
    public static AvailableWorkerDto from(WorkerProfile w) {
        String phone = w.getUser() != null ? w.getUser().getPhone() : "";
        List<String> profs = w.getProfessions() != null
                ? w.getProfessions().stream().map(p -> p.getName()).toList()
                : List.of();

        return new AvailableWorkerDto(
                w.getId(),
                w.getUser() != null ? w.getUser().getId() : null,
                w.getFirstName() + (w.getLastName() != null ? " " + w.getLastName() : ""),
                phone,
                w.getAvatarUrl(),
                w.getRegion() != null ? w.getRegion().getId() : null,
                w.getRegion() != null ? w.getRegion().getName() : null,
                w.getDistrict() != null ? w.getDistrict().getId() : null,
                w.getDistrict() != null ? w.getDistrict().getName() : null,
                w.getExperienceYears(),
                w.isAvailable(),
                w.getLatitude(),
                w.getLongitude(),
                profs
        );
    }
}
