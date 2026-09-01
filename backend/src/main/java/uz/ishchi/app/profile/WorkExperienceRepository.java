package uz.ishchi.app.profile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkExperienceRepository extends JpaRepository<WorkExperience, Long> {

    List<WorkExperience> findByWorkerIdOrderByStartDateDesc(Long workerId);

    Optional<WorkExperience> findByIdAndWorkerId(Long id, Long workerId);
}
