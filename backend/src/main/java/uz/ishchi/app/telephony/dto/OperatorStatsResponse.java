package uz.ishchi.app.telephony.dto;

public record OperatorStatsResponse(
        long totalCallsToday,
        long answeredCallsToday,
        long missedCallsToday,
        long activeTickets,
        long completedTicketsToday,
        long emergencyTicketsCount
) {
}
