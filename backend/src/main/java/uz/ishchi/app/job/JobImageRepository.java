package uz.ishchi.app.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobImageRepository extends JpaRepository<JobImage, Long> {

    List<JobImage> findByJobIdOrderByCreatedAtAsc(Long jobId);

    Optional<JobImage> findByIdAndJobId(Long id, Long jobId);

    /** Stored file URLs of every image on every job posted by this user's employer profile. */
    @org.springframework.data.jpa.repository.Query("select i.url from JobImage i where i.job.employer.user.id = :userId")
    List<String> findUrlsByEmployerUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
