package uz.ishchi.app.admin.dto;

public record AdminRegionUpdateRequest(
        String name,
        Double centerLat,
        Double centerLng,
        Double radiusKm,
        Boolean active,
        Boolean allowJobs,
        Boolean allowWorkers,
        Long minSalaryRate,
        String notes
) {
}
