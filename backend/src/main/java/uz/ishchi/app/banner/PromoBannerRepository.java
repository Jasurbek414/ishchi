package uz.ishchi.app.banner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.BannerAudience;

import java.time.Instant;
import java.util.List;

public interface PromoBannerRepository extends JpaRepository<PromoBanner, Long> {

    List<PromoBanner> findAllByOrderBySortOrderAscCreatedAtAsc();

    @Query("select distinct b from PromoBanner b left join b.regions r where b.active = true and b.audience in :audiences " +
            "and (b.regions is empty or (:regionId is not null and r.id = :regionId)) " +
            "and (b.startAt is null or b.startAt <= :now) " +
            "and (b.endAt is null or b.endAt >= :now) " +
            "order by b.sortOrder asc, b.createdAt asc")
    List<PromoBanner> findVisible(@Param("audiences") List<BannerAudience> audiences,
                                   @Param("regionId") Long regionId,
                                   @Param("now") Instant now);

    @Modifying
    @Query("update PromoBanner b set b.viewCount = b.viewCount + 1 where b.id = :id")
    int incrementViewCount(@Param("id") Long id);

    @Modifying
    @Query("update PromoBanner b set b.clickCount = b.clickCount + 1 where b.id = :id")
    int incrementClickCount(@Param("id") Long id);
}
