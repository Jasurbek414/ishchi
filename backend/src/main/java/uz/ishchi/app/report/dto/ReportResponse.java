package uz.ishchi.app.report.dto;

import uz.ishchi.app.common.ReportReason;
import uz.ishchi.app.report.Report;

import java.time.Instant;

public record ReportResponse(
        Long id,
        Long reporterId,
        String reporterPhone,
        Long jobId,
        String jobTitle,
        Long reportedUserId,
        String reportedUserPhone,
        ReportReason reason,
        String details,
        boolean resolved,
        String resolutionNote,
        Instant createdAt,
        Instant resolvedAt
) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getReporter().getId(),
                report.getReporter().getPhone(),
                report.getJob() == null ? null : report.getJob().getId(),
                report.getJob() == null ? null : report.getJob().getTitle(),
                report.getReportedUser() == null ? null : report.getReportedUser().getId(),
                report.getReportedUser() == null ? null : report.getReportedUser().getPhone(),
                report.getReason(),
                report.getDetails(),
                report.isResolved(),
                report.getResolutionNote(),
                report.getCreatedAt(),
                report.getResolvedAt()
        );
    }
}
