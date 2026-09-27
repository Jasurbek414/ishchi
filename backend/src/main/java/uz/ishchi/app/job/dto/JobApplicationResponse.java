package uz.ishchi.app.job.dto;

import uz.ishchi.app.common.ApplicationStatus;
import uz.ishchi.app.job.JobApplication;
import uz.ishchi.app.profile.WorkerProfile;

import java.time.Instant;
import java.util.List;

/**
 * One responder, as the employer sees them on their shortlist.
 *
 * <p>The phone number is served here on purpose. Bulk worker listings withhold it precisely because
 * browsing them is unsolicited; a worker who put their hand up for this job is asking to be called,
 * which is a different thing entirely.
 */
public record JobApplicationResponse(
        Long id,
        Long jobId,
        String jobTitle,
        Long workerId,
        Long workerProfileId,
        String workerName,
        String workerAvatarUrl,
        String workerPhone,
        Integer experienceYears,
        Double ratingAverage,
        Integer ratingCount,
        boolean verified,
        List<String> professions,
        ApplicationStatus status,
        Instant createdAt
) {
    public static JobApplicationResponse forEmployer(JobApplication application, WorkerProfile profile) {
        return new JobApplicationResponse(
                application.getId(),
                application.getJob().getId(),
                application.getJob().getTitle(),
                application.getWorker().getId(),
                profile == null ? null : profile.getId(),
                profile == null ? null : profile.getFirstName() + " " + profile.getLastName(),
                profile == null ? null : profile.getAvatarUrl(),
                application.getWorker().getPhone(),
                profile == null ? null : profile.getExperienceYears(),
                profile == null ? null : profile.getRatingAverage(),
                profile == null ? null : profile.getRatingCount(),
                profile != null && profile.isVerified(),
                profile == null ? List.of() : profile.getProfessions().stream().map(p -> p.getName()).toList(),
                application.getStatus(),
                application.getCreatedAt()
        );
    }

    /** The worker's own view of a response they sent — no contact details of their own needed. */
    public static JobApplicationResponse forWorker(JobApplication application) {
        return new JobApplicationResponse(
                application.getId(),
                application.getJob().getId(),
                application.getJob().getTitle(),
                application.getWorker().getId(),
                null, null, null, null, null, null, null, false, List.of(),
                application.getStatus(),
                application.getCreatedAt()
        );
    }
}
