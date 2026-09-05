package uz.ishchi.app.landing;

import org.springframework.data.jpa.repository.JpaRepository;
import uz.ishchi.app.common.LandingItemType;

import java.util.List;

public interface LandingItemRepository extends JpaRepository<LandingItem, Long> {

    List<LandingItem> findByTypeOrderBySortOrderAscIdAsc(LandingItemType type);
}
