package uz.ishchi.app.location.dto;

import uz.ishchi.app.location.Region;

public record RegionResponse(Long id, String name) {
    public static RegionResponse from(Region region) {
        return new RegionResponse(region.getId(), region.getName());
    }
}
