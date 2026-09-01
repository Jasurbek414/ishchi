package uz.ishchi.app.job.dto;

import jakarta.validation.constraints.NotNull;
import uz.ishchi.app.common.JobStatus;

public record JobStatusUpdateRequest(@NotNull JobStatus status) {
}
