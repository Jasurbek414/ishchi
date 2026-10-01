package uz.ishchi.app.profile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long>, JpaSpecificationExecutor<WorkerProfile> {

    Optional<WorkerProfile> findByUserId(Long userId);

    /** Batch variant, so a list of users can be resolved in one query instead of per row. */
    @EntityGraph(attributePaths = {"user", "region", "district"})
    List<WorkerProfile> findByUserIdIn(Collection<Long> userIds);

    boolean existsByUserId(Long userId);

    /**
     * Search results used to lazy-load user, region and district per row — four extra queries for
     * every worker returned. Only the to-one sides are graphed here; join-fetching the professions
     * collection alongside a Pageable would move pagination into memory.
     */
    @Override
    @EntityGraph(attributePaths = {"user", "region", "district"})
    Page<WorkerProfile> findAll(Specification<WorkerProfile> spec, Pageable pageable);
}
