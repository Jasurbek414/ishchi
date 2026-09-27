package uz.ishchi.app.rating;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    boolean existsByJobIdAndRaterIdAndRateeId(Long jobId, Long raterId, Long rateeId);

    @EntityGraph(attributePaths = {"rater", "job"})
    Page<Rating> findByRateeIdOrderByCreatedAtDesc(Long rateeId, Pageable pageable);

    /** Average and count for one person, recomputed after each write rather than read per row. */
    @Query("select coalesce(avg(r.score), 0), count(r) from Rating r where r.ratee.id = :rateeId")
    Object[] aggregateFor(@Param("rateeId") Long rateeId);
}
