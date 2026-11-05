package uz.ishchi.app.banner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PromoRequestRepository extends JpaRepository<PromoRequest, Long> {

    @Query("select r from PromoRequest r left join fetch r.region left join fetch r.promoBanner where r.user.id = :userId order by r.createdAt desc")
    List<PromoRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("select r from PromoRequest r left join fetch r.user left join fetch r.region left join fetch r.promoBanner order by case when r.status = 'PENDING' then 0 else 1 end, r.createdAt desc")
    List<PromoRequest> findAllForAdmin();
}
