package uz.ishchi.app.job;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.config.SchedulerLock;
import uz.ishchi.app.notification.DeviceTokenRepository;
import uz.ishchi.app.notification.NotificationService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JobExpiryScheduler {

    /** Arbitrary but stable advisory-lock keys; they only need to be unique per job. */
    private static final long LOCK_EXPIRE_JOBS = 7_101_001L;
    private static final long LOCK_EXPIRY_REMINDERS = 7_101_002L;

    private final JobRepository jobRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationService notificationService;
    private final SchedulerLock schedulerLock;

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Tashkent")
    @Transactional
    public void expireOverdueJobs() {
        if (!schedulerLock.tryAcquire(LOCK_EXPIRE_JOBS)) {
            return;
        }
        jobRepository.expireOverdueJobs(Instant.now());
    }

    @Scheduled(cron = "0 15 0 * * *", zone = "Asia/Tashkent")
    @Transactional
    public void remindExpiringSoon() {
        if (!schedulerLock.tryAcquire(LOCK_EXPIRY_REMINDERS)) {
            return;
        }
        Instant now = Instant.now();
        List<Job> expiringSoon = jobRepository.findExpiringSoonUnnotified(now, now.plus(24, ChronoUnit.HOURS));
        if (expiringSoon.isEmpty()) {
            return;
        }

        // One token query for the whole batch rather than one per job.
        List<Long> employerUserIds = expiringSoon.stream()
                .map(job -> job.getEmployer().getUser().getId())
                .distinct()
                .toList();
        Map<Long, List<String>> tokensByUser = new HashMap<>();
        for (Object[] row : deviceTokenRepository.findUserIdAndTokenByUserIdIn(employerUserIds)) {
            tokensByUser.computeIfAbsent((Long) row[0], k -> new ArrayList<>()).add((String) row[1]);
        }

        for (Job job : expiringSoon) {
            List<String> tokens = tokensByUser.get(job.getEmployer().getUser().getId());
            if (tokens != null && !tokens.isEmpty()) {
                notificationService.send(tokens, "Buyurtma muddati tugayapti",
                        job.getTitle() + " — 24 soat ichida tugaydi",
                        Map.of("type", "job_expiring", "jobId", String.valueOf(job.getId())));
            }
            // Marked either way: a job whose owner has no device should not be retried nightly.
            job.setExpiryReminderSent(true);
        }
    }
}
