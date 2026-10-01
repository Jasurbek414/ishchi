package uz.ishchi.app.profile;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EmployerProfileRepository extends JpaRepository<EmployerProfile, Long> {

    Optional<EmployerProfile> findByUserId(Long userId);

    /** Batch variant, so a list of users can be resolved in one query instead of per row. */
    @EntityGraph(attributePaths = "user")
    List<EmployerProfile> findByUserIdIn(Collection<Long> userIds);

    boolean existsByUserId(Long userId);

    @Query("select e from EmployerProfile e where e.latitude is not null and e.longitude is not null " +
            "and e.user.active = true and (:regionId is null or e.region.id = :regionId) " +
            "and e.latitude between :minLat and :maxLat and e.longitude between :minLon and :maxLon " +
            "order by e.updatedAt desc")
    List<EmployerProfile> findForMap(@Param("regionId") Long regionId,
                                     @Param("minLat") double minLat, @Param("maxLat") double maxLat,
                                     @Param("minLon") double minLon, @Param("maxLon") double maxLon,
                                     Pageable pageable);
}
