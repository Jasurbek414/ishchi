package uz.ishchi.app.admin.dto;

import java.math.BigDecimal;
import java.util.Map;

public record StatsResponse(
        long totalUsers,
        long totalWorkers,
        long totalEmployers,
        long activeJobs,
        long newUsersToday,
        long newJobsToday,
        long blockedUsers,
        long telegramLinkedUsers,
        long pendingFeedback,
        BigDecimal walletTotalBalance,
        Map<String, Long> jobsByStatus
) {
}
