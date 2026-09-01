package uz.ishchi.app.profile;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployerProfileRepository extends JpaRepository<EmployerProfile, Long> {

    Optional<EmployerProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("select e from EmployerProfile e where e.latitude is not null and e.longitude is not null " +
            "and e.user.active = true and (:regionId is null or e.region.id = :regionId) " +
            "order by e.updatedAt desc")
    List<EmployerProfile> findForMap(@Param("regionId") Long regionId, Pageable pageable);
}
