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
        /*
         * Yesterday's figures, so today's can be read as up or down. "12 new users" on its own says
         * nothing about whether that is a good day — which is what the dashboard was asking the
         * reader to guess.
         */
        long newUsersYesterday,
        long newJobsYesterday,
        long blockedUsers,
        long telegramLinkedUsers,
        long pendingFeedback,
        long openReports,
        BigDecimal walletTotalBalance,
        Map<String, Long> jobsByStatus
) {
}
