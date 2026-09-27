package uz.ishchi.app.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.ishchi.app.common.OtpPurpose;

import java.time.Instant;
import java.util.Optional;

public interface OtpCodeRepository extends JpaRepository<OtpCode, Long> {

    Optional<OtpCode> findTopByPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(String phone, OtpPurpose purpose);

    /** Housekeeping: expired and spent codes were kept forever. */
    @Modifying
    @Query("delete from OtpCode o where o.expiresAt < :cutoff")
    int deleteExpired(@Param("cutoff") Instant cutoff);
}
