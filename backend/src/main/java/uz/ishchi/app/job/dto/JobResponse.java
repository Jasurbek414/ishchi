package uz.ishchi.app.job.dto;

import uz.ishchi.app.common.DurationUnit;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.PaymentType;
import uz.ishchi.app.job.Job;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record JobResponse(
        Long id,
        Long employerId,
        String employerName,
        String employerAvatarUrl,
        String employerPhone,
        String title,
        String description,
        Long professionId,
        String professionName,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        BigDecimal payment,
        PaymentType paymentType,
        JobType jobType,
        Integer workersNeeded,
        LocalDate startDate,
        Integer durationValue,
        DurationUnit durationUnit,
        JobStatus status,
        Instant createdAt,
        List<JobImageResponse> images,
        Double latitude,
        Double longitude,
        boolean unlocked
) {
    public static JobResponse from(Job job) {
        return from(job, true);
    }

    /**
     * @param unlocked when {@code false} (a worker who hasn't paid the job-view fee yet),
     *                  the employer's phone number is withheld — everything else about the
     *                  job stays visible so browsing/searching remains free.
     */
    public static JobResponse from(Job job, boolean unlocked) {
        return new JobResponse(
                job.getId(),
                job.getEmployer().getId(),
                job.getEmployer().getFirstName() + " " + job.getEmployer().getLastName(),
                job.getEmployer().getAvatarUrl(),
                unlocked ? job.getEmployer().getUser().getPhone() : null,
                job.getTitle(),
                job.getDescription(),
                job.getProfession().getId(),
                job.getProfession().getName(),
                job.getRegion().getId(),
                job.getRegion().getName(),
                job.getDistrict().getId(),
                job.getDistrict().getName(),
                job.getPayment(),
                job.getPaymentType(),
                job.getJobType(),
                job.getWorkersNeeded(),
                job.getStartDate(),
                job.getDurationValue(),
                job.getDurationUnit(),
                job.getStatus(),
                job.getCreatedAt(),
                job.getImages().stream().map(JobImageResponse::from).toList(),
                job.getLatitude(),
                job.getLongitude(),
                unlocked
        );
    }
}
