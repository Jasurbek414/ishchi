package uz.ishchi.app.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.Role;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    Optional<DeviceToken> findByToken(String token);

    void deleteByToken(String token);

    void deleteByTokenAndUserId(String token, Long userId);

    @Query("select dt.token from DeviceToken dt " +
            "join WorkerProfile wp on wp.user = dt.user " +
            "join wp.professions p " +
            "where dt.user.active = true and p.id = :professionId and wp.region.id = :regionId")
    List<String> findTokensForMatchingWorkers(@Param("professionId") Long professionId, @Param("regionId") Long regionId);

    @Query("select dt.token from DeviceToken dt where dt.user.active = true")
    List<String> findAllActiveTokens();

    @Query("select dt.token from DeviceToken dt where dt.user.active = true and dt.user.role = :role")
    List<String> findTokensByRole(@Param("role") Role role);

    @Query("select dt.token from DeviceToken dt join WorkerProfile wp on wp.user = dt.user " +
            "where dt.user.active = true and dt.user.role = 'WORKER' and wp.region.id = :regionId")
    List<String> findWorkerTokensByRegion(@Param("regionId") Long regionId);

    @Query("select dt.token from DeviceToken dt join EmployerProfile ep on ep.user = dt.user " +
            "where dt.user.active = true and dt.user.role = 'EMPLOYER' and ep.region.id = :regionId")
    List<String> findEmployerTokensByRegion(@Param("regionId") Long regionId);

    @Query("select dt.token from DeviceToken dt where dt.user.id = :userId")
    List<String> findTokensByUserId(@Param("userId") Long userId);

    /** Batch variant for the nightly reminder, which used to query once per job it notified. */
    @Query("select dt.user.id, dt.token from DeviceToken dt where dt.user.id in :userIds")
    List<Object[]> findUserIdAndTokenByUserIdIn(@Param("userIds") Collection<Long> userIds);
}
