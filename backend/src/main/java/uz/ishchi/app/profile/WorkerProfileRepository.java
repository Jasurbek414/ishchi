package uz.ishchi.app.profile;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long>, JpaSpecificationExecutor<WorkerProfile> {

    Optional<WorkerProfile> findByUserId(Long userId);

    /** Batch variant, so a list of users can be resolved in one query instead of per row. */
    @EntityGraph(attributePaths = "user")
    List<WorkerProfile> findByUserIdIn(Collection<Long> userIds);

    boolean existsByUserId(Long userId);
}
