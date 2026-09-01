package uz.ishchi.app.job.dto;

import jakarta.validation.constraints.*;
import uz.ishchi.app.common.DurationUnit;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.PaymentType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record JobCreateRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 4000) String description,
        @NotNull Long professionId,
        @NotNull Long regionId,
        @NotNull Long districtId,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal payment,
        @NotNull PaymentType paymentType,
        @NotNull JobType jobType,
        @Min(1) Integer workersNeeded,
        LocalDate startDate,
        @Min(1) Integer durationValue,
        DurationUnit durationUnit,
        Double latitude,
        Double longitude
) {
}
