package uz.ishchi.app.job;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobImageRepository extends JpaRepository<JobImage, Long> {

    List<JobImage> findByJobIdOrderByCreatedAtAsc(Long jobId);

    Optional<JobImage> findByIdAndJobId(Long id, Long jobId);
}
