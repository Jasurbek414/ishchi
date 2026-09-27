package uz.ishchi.app.job;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.ApplicationStatus;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.dto.JobApplicationResponse;
import uz.ishchi.app.notification.DeviceTokenRepository;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.user.User;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Responses to a job: a worker putting their hand up, and the employer working through who replied.
 *
 * <p>Deliberately free of any charge. The whole point is to learn who was interested, and putting a
 * fee in front of that would collect less of exactly the signal the platform is missing. It also
 * turns the contact problem around: instead of a worker paying to reveal a number and calling into
 * the dark, the employer gets a shortlist and calls the people who actually want the work.
 */
@Service
@RequiredArgsConstructor
public class JobApplicationService {

    private final JobApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationService notificationService;

    @Transactional
    public JobApplicationResponse apply(User worker, Long jobId) {
        Job job = openJob(jobId);
        if (job.getEmployer().getUser().getId().equals(worker.getId())) {
            throw ApiException.badRequest("O'z buyurtmangizga javob bera olmaysiz");
        }

        JobApplication existing = applicationRepository.findByJobIdAndWorkerId(jobId, worker.getId()).orElse(null);
        if (existing != null) {
            return JobApplicationResponse.forWorker(existing);
        }

        JobApplication application = applicationRepository.save(new JobApplication(job, worker));
        notifyEmployer(job, worker);
        return JobApplicationResponse.forWorker(application);
    }

    @Transactional
    public void withdraw(User worker, Long jobId) {
        JobApplication application = applicationRepository.findByJobIdAndWorkerId(jobId, worker.getId())
                .orElseThrow(() -> ApiException.notFound("Javob topilmadi"));
        if (application.getStatus() == ApplicationStatus.HIRED) {
            throw ApiException.badRequest("Ish beruvchi sizni tanlagan — javobni qaytarib bo'lmaydi");
        }
        applicationRepository.delete(application);
    }

    /** The employer's shortlist. Contact details are served here because these workers asked to be called. */
    @Transactional(readOnly = true)
    public List<JobApplicationResponse> listForEmployer(User employerUser, Long jobId) {
        Job job = ownedJob(employerUser, jobId);
        List<JobApplication> applications = applicationRepository.findByJobIdOrderByCreatedAtDesc(job.getId());
        Map<Long, WorkerProfile> profiles = profilesFor(applications);
        return applications.stream()
                .map(a -> JobApplicationResponse.forEmployer(a, profiles.get(a.getWorker().getId())))
                .toList();
    }

    @Transactional
    public JobApplicationResponse decide(User employerUser, Long jobId, Long workerUserId, ApplicationStatus status) {
        if (status == ApplicationStatus.INTERESTED) {
            throw ApiException.badRequest("Faqat 'tanlandi' yoki 'rad etildi' holatini belgilash mumkin");
        }
        Job job = ownedJob(employerUser, jobId);
        JobApplication application = applicationRepository.findByJobIdAndWorkerId(job.getId(), workerUserId)
                .orElseThrow(() -> ApiException.notFound("Javob topilmadi"));
        application.setStatus(status);

        List<String> tokens = deviceTokenRepository.findTokensByUserId(workerUserId);
        notificationService.send(tokens,
                status == ApplicationStatus.HIRED ? "Sizni tanladilar!" : "Javobingiz ko'rib chiqildi",
                job.getTitle(), Map.of("type", "application", "jobId", String.valueOf(job.getId())));

        WorkerProfile profile = workerProfileRepository.findByUserId(workerUserId).orElse(null);
        return JobApplicationResponse.forEmployer(application, profile);
    }

    @Transactional(readOnly = true)
    public Page<JobApplicationResponse> listForWorker(User worker, Pageable pageable) {
        return applicationRepository.findByWorkerIdOrderByCreatedAtDesc(worker.getId(), pageable)
                .map(JobApplicationResponse::forWorker);
    }

    /** Response counts for a page of jobs, in one query rather than per row. */
    @Transactional(readOnly = true)
    public Map<Long, Long> countsFor(List<Long> jobIds) {
        if (jobIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : applicationRepository.countByJobIdIn(jobIds)) {
            counts.put((Long) row[0], (Long) row[1]);
        }
        return counts;
    }

    /** This worker's own status on a page of jobs, so the list can show "javob berilgan". */
    @Transactional(readOnly = true)
    public Map<Long, ApplicationStatus> statusesFor(Long workerUserId, List<Long> jobIds) {
        if (jobIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, ApplicationStatus> statuses = new HashMap<>();
        for (Object[] row : applicationRepository.findStatusesForWorker(workerUserId, jobIds)) {
            statuses.put((Long) row[0], (ApplicationStatus) row[1]);
        }
        return statuses;
    }

    private void notifyEmployer(Job job, User worker) {
        WorkerProfile profile = workerProfileRepository.findByUserId(worker.getId()).orElse(null);
        String who = profile == null ? "Bir ishchi" : profile.getFirstName() + " " + profile.getLastName();
        List<String> tokens = deviceTokenRepository.findTokensByUserId(job.getEmployer().getUser().getId());
        notificationService.send(tokens, "Buyurtmangizga javob keldi",
                who + " — " + job.getTitle(),
                Map.of("type", "job_application", "jobId", String.valueOf(job.getId())));
    }

    private Map<Long, WorkerProfile> profilesFor(List<JobApplication> applications) {
        List<Long> workerUserIds = applications.stream().map(a -> a.getWorker().getId()).distinct().toList();
        if (workerUserIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, WorkerProfile> profiles = new HashMap<>();
        workerProfileRepository.findByUserIdIn(workerUserIds)
                .forEach(profile -> profiles.put(profile.getUser().getId(), profile));
        return profiles;
    }

    private Job openJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (job.isBlocked()) {
            throw ApiException.notFound("Buyurtma topilmadi");
        }
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw ApiException.badRequest("Bu buyurtma endi faol emas");
        }
        return job;
    }

    private Job ownedJob(User employerUser, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (!job.getEmployer().getUser().getId().equals(employerUser.getId())) {
            throw ApiException.forbidden("Bu buyurtma sizga tegishli emas");
        }
        return job;
    }
}
