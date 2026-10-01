package uz.ishchi.app.report.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import uz.ishchi.app.common.ReportReason;

/** Report a posting or a person. Exactly one target is expected. */
public record ReportRequest(
        Long jobId,
        Long reportedUserId,
        @NotNull ReportReason reason,
        @Size(max = 1000) String details
) {
}
