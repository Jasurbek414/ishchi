package uz.ishchi.app.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);

    @Modifying
    @Query("update RefreshToken r set r.revoked = true where r.user.id = :userId and r.revoked = false")
    void revokeAllForUser(Long userId);

    /** Housekeeping: nothing ever removed spent tokens, so the table only grew. */
    @Modifying
    @Query("delete from RefreshToken r where r.expiresAt < :cutoff or (r.revoked = true and r.createdAt < :cutoff)")
    int deleteSpentTokens(@Param("cutoff") Instant cutoff);
}
