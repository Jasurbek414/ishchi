package uz.ishchi.app.admin.dto;

import uz.ishchi.app.common.DurationUnit;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.PaymentType;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.job.JobImage;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AdminJobResponse(
        Long id,
        String title,
        String description,
        Long employerId,
        String employerName,
        String employerPhone,
        String professionName,
        String regionName,
        String districtName,
        BigDecimal payment,
        PaymentType paymentType,
        JobType jobType,
        Integer workersNeeded,
        LocalDate startDate,
        Integer durationValue,
        DurationUnit durationUnit,
        Double latitude,
        Double longitude,
        List<String> images,
        JobStatus status,
        boolean blocked,
        Instant expiresAt,
        Instant createdAt
) {
    public static AdminJobResponse from(Job job) {
        return new AdminJobResponse(
                job.getId(),
                job.getTitle(),
                job.getDescription(),
                job.getEmployer().getUser().getId(),
                job.getEmployer().getFirstName() + " " + job.getEmployer().getLastName(),
                job.getEmployer().getUser().getPhone(),
                job.getProfession().getName(),
                job.getRegion().getName(),
                job.getDistrict().getName(),
                job.getPayment(),
                job.getPaymentType(),
                job.getJobType(),
                job.getWorkersNeeded(),
                job.getStartDate(),
                job.getDurationValue(),
                job.getDurationUnit(),
                job.getLatitude(),
                job.getLongitude(),
                job.getImages().stream().map(JobImage::getUrl).toList(),
                job.getStatus(),
                job.isBlocked(),
                job.getExpiresAt(),
                job.getCreatedAt()
        );
    }
}
