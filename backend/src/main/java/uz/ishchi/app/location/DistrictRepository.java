package uz.ishchi.app.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, Long> {

    List<District> findByRegionIdOrderByNameAsc(Long regionId);

    Optional<District> findByRegionIdAndNameIgnoreCase(Long regionId, String name);
}
