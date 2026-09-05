package uz.ishchi.app.profession;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProfessionRepository extends JpaRepository<Profession, Long> {

    List<Profession> findByActiveTrueOrderByCategoryAscNameAsc();

    List<Profession> findAllByOrderByCategoryAscNameAsc();

    boolean existsByNameIgnoreCase(String name);

    Optional<Profession> findByActiveTrueAndNameIgnoreCase(String name);
}
