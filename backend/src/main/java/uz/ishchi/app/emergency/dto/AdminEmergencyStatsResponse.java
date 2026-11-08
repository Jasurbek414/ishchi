package uz.ishchi.app.emergency.dto;

public record AdminEmergencyStatsResponse(
        long pendingCount,
        long approvedCount,
        long rejectedCount,
        long totalSpecialists
) {}
