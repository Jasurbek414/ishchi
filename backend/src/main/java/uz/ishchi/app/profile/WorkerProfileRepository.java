package uz.ishchi.app.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long>, JpaSpecificationExecutor<WorkerProfile> {

    Optional<WorkerProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
