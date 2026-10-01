package uz.ishchi.app.rating.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RatingRequest(
        @NotNull Long jobId,
        /** Who is being rated. The other side of the job, verified against the application record. */
        @NotNull Long rateeUserId,
        @NotNull @Min(1) @Max(5) Integer score,
        @Size(max = 500) String comment
) {
}
