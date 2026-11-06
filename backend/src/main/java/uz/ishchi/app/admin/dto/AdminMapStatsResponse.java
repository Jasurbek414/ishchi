package uz.ishchi.app.admin.dto;

public record AdminMapStatsResponse(
        long totalRegions,
        long activeRegions,
        long restrictedRegions,
        long totalDistricts,
        long totalJobs,
        long jobsWithCoordinates,
        long totalWorkers,
        long totalEmployers
) {
}
