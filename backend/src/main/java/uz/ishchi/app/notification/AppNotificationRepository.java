package uz.ishchi.app.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AppNotificationRepository extends JpaRepository<AppNotification, Long> {

    List<AppNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<AppNotification> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByUserIdAndReadFalse(Long userId);

    @Modifying
    @Query("update AppNotification n set n.read = true where n.user.id = :userId and n.read = false")
    int markAllAsRead(@Param("userId") Long userId);

    @Modifying
    @Query("delete from AppNotification n where n.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
