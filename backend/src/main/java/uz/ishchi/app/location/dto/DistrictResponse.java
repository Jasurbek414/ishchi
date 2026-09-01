package uz.ishchi.app.location.dto;

import uz.ishchi.app.location.District;

public record DistrictResponse(Long id, String name, Long regionId) {
    public static DistrictResponse from(District district) {
        return new DistrictResponse(district.getId(), district.getName(), district.getRegion().getId());
    }
}
