package uz.ishchi.app.job.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import uz.ishchi.app.common.DurationUnit;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record JobUpdateRequest(
        @Size(max = 200) String title,
        @Size(max = 4000) String description,
        Long professionId,
        Long regionId,
        Long districtId,
        @DecimalMin(value = "0.0", inclusive = false) BigDecimal payment,
        PaymentType paymentType,
        JobType jobType,
        @Min(1) Integer workersNeeded,
        LocalDate startDate,
        @Min(1) Integer durationValue,
        DurationUnit durationUnit,
        Double latitude,
        Double longitude,
        Boolean urgent
) {
}
