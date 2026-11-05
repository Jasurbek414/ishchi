package uz.ishchi.app.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long>, JpaSpecificationExecutor<WorkerProfile> {

    Optional<WorkerProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("select p.avatarUrl from WorkerProfile p where p.user.id = :userId")
    Optional<String> findAvatarUrlByUserId(@Param("userId") Long userId);
}
