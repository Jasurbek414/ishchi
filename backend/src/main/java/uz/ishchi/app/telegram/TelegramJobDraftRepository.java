package uz.ishchi.app.telegram;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface TelegramJobDraftRepository extends JpaRepository<TelegramJobDraft, Long> {

    /**
     * Drafts a user started and walked away from. Nothing ever removed them, so the table — and the
     * photos each one had already written to disk — grew for the lifetime of the deployment. The
     * image collection is fetched along with the row so the files can be deleted too.
     */
    @EntityGraph(attributePaths = "imageUrls")
    @Query("select d from TelegramJobDraft d where d.updatedAt < :cutoff")
    List<TelegramJobDraft> findStale(@Param("cutoff") Instant cutoff);
}
