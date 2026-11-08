package uz.ishchi.app.emergency;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmergencyApplicationRepository extends JpaRepository<EmergencyApplication, Long> {

    Optional<EmergencyApplication> findTopByWorkerIdOrderByCreatedAtDesc(Long workerId);

    Page<EmergencyApplication> findByStatusOrderByCreatedAtDesc(EmergencyApplicationStatus status, Pageable pageable);

    Page<EmergencyApplication> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(EmergencyApplicationStatus status);

    @Query("select count(w) from WorkerProfile w where w.emergency = true")
    long countApprovedSpecialists();
}
