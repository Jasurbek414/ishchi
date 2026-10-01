package uz.ishchi.app.rating;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.ApplicationStatus;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.job.JobApplicationRepository;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.rating.dto.RatingRequest;
import uz.ishchi.app.rating.dto.RatingResponse;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Ratings, gated on the two people having actually worked together.
 *
 * <p>A rating is only accepted when the job is finished and the application record says this worker
 * was hired for it — so a rating cannot be left by someone who merely read the posting, and every
 * score traces back to a specific job.
 */
@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;

    @Transactional
    public RatingResponse rate(User rater, RatingRequest request) {
        Job job = jobRepository.findById(request.jobId())
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (job.getStatus() != JobStatus.COMPLETED) {
            throw ApiException.badRequest("Baho faqat yakunlangan buyurtma uchun qoldiriladi");
        }
        if (rater.getId().equals(request.rateeUserId())) {
            throw ApiException.badRequest("O'zingizga baho qo'ya olmaysiz");
        }

        User ratee = userRepository.findById(request.rateeUserId())
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
        requireWorkedTogether(job, rater, ratee);

        if (ratingRepository.existsByJobIdAndRaterIdAndRateeId(job.getId(), rater.getId(), ratee.getId())) {
            throw ApiException.conflict("Bu buyurtma uchun baho allaqachon qoldirilgan");
        }

        Rating rating = ratingRepository.save(new Rating(job, rater, ratee,
                request.score().shortValue(), request.comment()));
        recomputeAggregate(ratee);
        return RatingResponse.from(rating);
    }

    @Transactional(readOnly = true)
    public Page<RatingResponse> listFor(Long userId, Pageable pageable) {
        return ratingRepository.findByRateeIdOrderByCreatedAtDesc(userId, pageable).map(RatingResponse::from);
    }

    /**
     * Exactly one of the two must be the job's employer and the other the worker it hired. Anything
     * else — a bystander, a worker who only expressed interest — is refused.
     */
    private void requireWorkedTogether(Job job, User rater, User ratee) {
        Long employerUserId = job.getEmployer().getUser().getId();
        Long workerUserId;
        if (rater.getId().equals(employerUserId)) {
            workerUserId = ratee.getId();
        } else if (ratee.getId().equals(employerUserId)) {
            workerUserId = rater.getId();
        } else {
            throw ApiException.forbidden("Siz bu buyurtmada qatnashmagansiz");
        }
        if (!applicationRepository.existsByJobIdAndWorkerIdAndStatus(
                job.getId(), workerUserId, ApplicationStatus.HIRED)) {
            throw ApiException.forbidden("Bu buyurtmada birga ishlaganingiz qayd etilmagan");
        }
    }

    /**
     * Refreshes the denormalised average in the same transaction as the write.
     *
     * <p>The score belongs to the person, not to a role: one account can both hire and be hired, and
     * "this person is reliable" carries over either way. So the same figure is mirrored onto
     * whichever profiles the account has, rather than kept twice and diverging.
     */
    private void recomputeAggregate(User ratee) {
        Object[] row = ratingRepository.aggregateFor(ratee.getId());
        // A single-row projection comes back as {avg, count}; some drivers nest it one level deeper.
        Object[] values = row.length == 1 && row[0] instanceof Object[] inner ? inner : row;
        double average = values[0] == null ? 0 : ((Number) values[0]).doubleValue();
        int count = values[1] == null ? 0 : ((Number) values[1]).intValue();
        Double rounded = count == 0 ? null
                : BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP).doubleValue();

        workerProfileRepository.findByUserId(ratee.getId()).ifPresent(p -> {
            p.setRatingAverage(rounded);
            p.setRatingCount(count);
        });
        employerProfileRepository.findByUserId(ratee.getId()).ifPresent(p -> {
            p.setRatingAverage(rounded);
            p.setRatingCount(count);
        });
    }
}
