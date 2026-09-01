package uz.ishchi.app.job;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.notification.DeviceTokenRepository;
import uz.ishchi.app.notification.NotificationService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class JobExpiryScheduler {

    private final JobRepository jobRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 5 0 * * *", zone = "Asia/Tashkent")
    @Transactional
    public void expireOverdueJobs() {
        jobRepository.expireOverdueJobs(Instant.now());
    }

    @Scheduled(cron = "0 15 0 * * *", zone = "Asia/Tashkent")
    @Transactional
    public void remindExpiringSoon() {
        Instant now = Instant.now();
        Instant soon = now.plus(24, ChronoUnit.HOURS);
        List<Job> expiringSoon = jobRepository.findExpiringSoonUnnotified(now, soon);
        for (Job job : expiringSoon) {
            List<String> tokens = deviceTokenRepository.findTokensByUserId(job.getEmployer().getUser().getId());
            notificationService.send(tokens, "Buyurtma muddati tugayapti",
                    job.getTitle() + " — 24 soat ichida tugaydi",
                    Map.of("type", "job_expiring", "jobId", String.valueOf(job.getId())));
            job.setExpiryReminderSent(true);
        }
    }
}
