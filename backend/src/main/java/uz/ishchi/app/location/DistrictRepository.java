package uz.ishchi.app.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DistrictRepository extends JpaRepository<District, Long> {

    List<District> findByRegionIdOrderByNameAsc(Long regionId);

    Optional<District> findByRegionIdAndNameIgnoreCase(Long regionId, String name);

    @org.springframework.data.jpa.repository.Query("select d.region.id, count(d) from District d group by d.region.id")
    List<Object[]> countDistrictsByRegionGrouped();
}
