package uz.ishchi.app.banner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.BannerAudience;

import java.util.List;

public interface PromoBannerRepository extends JpaRepository<PromoBanner, Long> {

    List<PromoBanner> findAllByOrderBySortOrderAscCreatedAtAsc();

    @Query("select b from PromoBanner b where b.active = true and b.audience in :audiences " +
            "and (b.region is null or (:regionId is not null and b.region.id = :regionId)) " +
            "order by b.sortOrder asc, b.createdAt asc")
    List<PromoBanner> findVisible(@Param("audiences") List<BannerAudience> audiences, @Param("regionId") Long regionId);
}
