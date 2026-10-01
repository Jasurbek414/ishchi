package uz.ishchi.app.job;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.ApplicationStatus;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    Optional<JobApplication> findByJobIdAndWorkerId(Long jobId, Long workerId);

    boolean existsByJobIdAndWorkerId(Long jobId, Long workerId);

    void deleteByJobIdAndWorkerId(Long jobId, Long workerId);

    /** The employer's shortlist for one job. */
    @EntityGraph(attributePaths = "worker")
    List<JobApplication> findByJobIdOrderByCreatedAtDesc(Long jobId);

    /** A worker's own history, newest first. */
    @EntityGraph(attributePaths = {"job", "job.employer", "job.profession", "job.region", "job.district"})
    Page<JobApplication> findByWorkerIdOrderByCreatedAtDesc(Long workerId, Pageable pageable);

    long countByJobId(Long jobId);

    /** Counts for a page of jobs in one query, so a list does not ask per row. */
    @Query("select a.job.id, count(a) from JobApplication a where a.job.id in :jobIds group by a.job.id")
    List<Object[]> countByJobIdIn(@Param("jobIds") Collection<Long> jobIds);

    /** This worker's own status on a page of jobs, in one query. */
    @Query("select a.job.id, a.status from JobApplication a where a.worker.id = :workerId and a.job.id in :jobIds")
    List<Object[]> findStatusesForWorker(@Param("workerId") Long workerId, @Param("jobIds") Collection<Long> jobIds);

    long countByWorkerIdAndStatus(Long workerId, ApplicationStatus status);

    /** Whether these two were ever put in touch by this job — the precondition for rating. */
    boolean existsByJobIdAndWorkerIdAndStatus(Long jobId, Long workerId, ApplicationStatus status);
}
