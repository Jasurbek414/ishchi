package uz.ishchi.app.telegram;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface TelegramAwaitingFeedbackRepository extends JpaRepository<TelegramAwaitingFeedback, Long> {

    /** A user who tapped "leave feedback" and never wrote anything left a row behind forever. */
    @Modifying
    @Query("delete from TelegramAwaitingFeedback a where a.createdAt < :cutoff")
    int deleteStale(@Param("cutoff") Instant cutoff);
}
