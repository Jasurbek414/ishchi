package uz.ishchi.app.admin.dto;

import java.util.List;

public record AdminRegionDetailResponse(
        Long id,
        String name,
        Double centerLat,
        Double centerLng,
        Double radiusKm,
        boolean active,
        boolean allowJobs,
        boolean allowWorkers,
        Long minSalaryRate,
        Long maxSalaryRate,
        String operationMode,
        String notes,
        long districtCount,
        long jobsCount,
        long workersCount,
        long employersCount,
        List<AdminDistrictSummary> districts
) {
    public record AdminDistrictSummary(
            Long id,
            String name,
            long jobsCount,
            long workersCount
    ) {
    }
}
