package uz.ishchi.app.job;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface JobUnlockRepository extends JpaRepository<JobUnlock, Long> {

    boolean existsByJobIdAndWorkerId(Long jobId, Long workerId);

    @Query("select u.job.id from JobUnlock u where u.worker.id = :workerId and u.job.id in :jobIds")
    Set<Long> findUnlockedJobIds(Long workerId, List<Long> jobIds);
}
