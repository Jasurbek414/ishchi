package uz.ishchi.app.search;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedSearchRepository extends JpaRepository<SavedSearch, Long> {

    List<SavedSearch> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<SavedSearch> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    /**
     * Every search that wants to be told about new work. Associations come along because each one is
     * compared against the job that was just posted.
     */
    @EntityGraph(attributePaths = {"user", "profession", "region", "district"})
    List<SavedSearch> findByNotifyTrue();
}
