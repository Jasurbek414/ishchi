package uz.ishchi.app.config;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.auth.OtpCodeRepository;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.telegram.TelegramAwaitingFeedbackRepository;
import uz.ishchi.app.telegram.TelegramJobDraft;
import uz.ishchi.app.telegram.TelegramJobDraftRepository;
import uz.ishchi.app.user.RefreshTokenRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Clears out the short-lived rows nothing ever deleted: spent OTP codes and refresh tokens (one per
 * login and per code request, kept forever), and the Telegram bot's conversation state — an
 * abandoned job draft held onto every photo it had already written to disk.
 */
@Component
@RequiredArgsConstructor
public class DataRetentionScheduler {

    private static final Logger log = LoggerFactory.getLogger(DataRetentionScheduler.class);

    private static final long LOCK_RETENTION = 7_101_003L;

    /** Kept well past expiry so anything still in flight, or worth looking at, survives. */
    private static final int OTP_RETENTION_DAYS = 7;
    private static final int REFRESH_TOKEN_RETENTION_DAYS = 30;
    /** Long enough that nobody loses a draft they are genuinely still working through. */
    private static final int TELEGRAM_DRAFT_RETENTION_DAYS = 3;

    private final OtpCodeRepository otpCodeRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TelegramJobDraftRepository telegramJobDraftRepository;
    private final TelegramAwaitingFeedbackRepository telegramAwaitingFeedbackRepository;
    private final FileStorageService fileStorageService;
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

        Instant draftCutoff = now.minus(TELEGRAM_DRAFT_RETENTION_DAYS, ChronoUnit.DAYS);
        List<TelegramJobDraft> staleDrafts = telegramJobDraftRepository.findStale(draftCutoff);
        staleDrafts.forEach(draft -> draft.getImageUrls().forEach(fileStorageService::deleteAfterCommit));
        telegramJobDraftRepository.deleteAll(staleDrafts);
        int prompts = telegramAwaitingFeedbackRepository.deleteStale(draftCutoff);

        if (codes > 0 || tokens > 0 || !staleDrafts.isEmpty() || prompts > 0) {
            log.info("Tozalandi: {} OTP kod, {} refresh token, {} qoralama, {} kutilayotgan fikr-mulohaza",
                    codes, tokens, staleDrafts.size(), prompts);
        }
    }
}
