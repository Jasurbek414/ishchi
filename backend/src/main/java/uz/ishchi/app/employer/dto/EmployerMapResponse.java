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
    /**
     * Withholds the phone number. Serving it here handed every worker the employer contact details
     * that the job-view fee is supposed to charge for — 500 at a time, for free — so the paywall
     * on the job list was bypassable by opening the map instead.
     *
     * <p>Blank rather than null: the mobile client parses this field as a non-nullable String.
     */
    public static EmployerMapResponse from(EmployerProfile p) {
        return new EmployerMapResponse(
                p.getId(),
                p.getUser().getId(),
                p.getFirstName(),
                p.getLastName(),
                p.getAvatarUrl(),
                "",
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
