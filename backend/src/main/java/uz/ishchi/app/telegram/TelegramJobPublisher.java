package uz.ishchi.app.telegram;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.JobService;
import uz.ishchi.app.job.dto.JobCreateRequest;
import uz.ishchi.app.job.dto.JobResponse;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.util.List;

/**
 * Publishes a finished Telegram draft as a job in its own transaction.
 *
 * <p>The wizard used to call {@code JobService.create} directly from inside the webhook's
 * transaction and catch the failure. Because the two shared a transaction, a rejected create (an
 * insufficient wallet balance, say) marked the whole thing rollback-only, so the friendly reply was
 * sent and then the commit blew up with UnexpectedRollbackException — which left the webhook
 * returning 500 and Telegram redelivering the same update. Running it separately keeps a rejection
 * contained, so the wizard can report it and leave the draft intact for another try.
 */
@Service
@RequiredArgsConstructor
public class TelegramJobPublisher {

    private final JobService jobService;
    private final UserRepository userRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public JobResponse publish(long chatId, JobCreateRequest request, List<String> imageUrls) {
        User employerUser = userRepository.findByTelegramChatId(chatId)
                .orElseThrow(() -> ApiException.badRequest("Akkaunt topilmadi, /start bilan qayta boshlang"));
        JobResponse job = jobService.create(employerUser, request);
        if (!imageUrls.isEmpty()) {
            jobService.attachImageUrls(job.id(), imageUrls);
        }
        return job;
    }
}
