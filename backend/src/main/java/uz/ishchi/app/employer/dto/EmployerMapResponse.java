package uz.ishchi.app.employer.dto;

import uz.ishchi.app.profile.EmployerProfile;

public record EmployerMapResponse(
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
        String about,
        Double latitude,
        Double longitude
) {
    public static EmployerMapResponse from(EmployerProfile p) {
        return new EmployerMapResponse(
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
                p.getAbout(),
                p.getLatitude(),
                p.getLongitude()
        );
    }
}
