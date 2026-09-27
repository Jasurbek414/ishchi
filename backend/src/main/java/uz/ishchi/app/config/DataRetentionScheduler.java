package uz.ishchi.app.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.auth.OtpCodeRepository;
import uz.ishchi.app.user.RefreshTokenRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Clears out short-lived auth rows. Nothing ever deleted spent OTP codes or refresh tokens, so both
 * tables grew for the lifetime of the deployment — one row per login and per code request, forever.
 */
@Component
@RequiredArgsConstructor
public class DataRetentionScheduler {

    private static final Logger log = LoggerFactory.getLogger(DataRetentionScheduler.class);

    private static final long LOCK_RETENTION = 7_101_003L;

    /** Kept well past expiry so anything still in flight, or worth looking at, survives. */
    private static final int OTP_RETENTION_DAYS = 7;
    private static final int REFRESH_TOKEN_RETENTION_DAYS = 30;

    private final OtpCodeRepository otpCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SchedulerLock schedulerLock;

    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Tashkent")
    @Transactional
    public void purgeExpiredAuthRows() {
        if (!schedulerLock.tryAcquire(LOCK_RETENTION)) {
            return;
        }
        Instant now = Instant.now();
        int codes = otpCodeRepository.deleteExpired(now.minus(OTP_RETENTION_DAYS, ChronoUnit.DAYS));
        int tokens = refreshTokenRepository.deleteSpentTokens(now.minus(REFRESH_TOKEN_RETENTION_DAYS, ChronoUnit.DAYS));
        if (codes > 0 || tokens > 0) {
            log.info("Tozalandi: {} OTP kod, {} refresh token", codes, tokens);
        }
    }
}
