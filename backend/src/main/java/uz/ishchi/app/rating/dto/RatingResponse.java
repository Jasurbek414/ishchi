package uz.ishchi.app.rating.dto;

import uz.ishchi.app.rating.Rating;

import java.time.Instant;

public record RatingResponse(
        Long id,
        Long jobId,
        String jobTitle,
        int score,
        String comment,
        Instant createdAt
) {
    public static RatingResponse from(Rating rating) {
        return new RatingResponse(
                rating.getId(),
                rating.getJob().getId(),
                rating.getJob().getTitle(),
                rating.getScore(),
                rating.getComment(),
                rating.getCreatedAt()
        );
    }
}
