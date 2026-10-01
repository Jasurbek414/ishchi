package uz.ishchi.app.report;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface ReportRepository extends JpaRepository<Report, Long> {

    @EntityGraph(attributePaths = {"reporter", "job", "reportedUser"})
    Page<Report> findByResolvedOrderByCreatedAtDesc(boolean resolved, Pageable pageable);

    @EntityGraph(attributePaths = {"reporter", "job", "reportedUser"})
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByResolvedFalse();

    /** Rate limiting is per IP; this stops one account filing the same complaint over and over. */
    boolean existsByReporterIdAndJobIdAndCreatedAtAfter(Long reporterId, Long jobId, Instant after);

    boolean existsByReporterIdAndReportedUserIdAndCreatedAtAfter(Long reporterId, Long userId, Instant after);
}
