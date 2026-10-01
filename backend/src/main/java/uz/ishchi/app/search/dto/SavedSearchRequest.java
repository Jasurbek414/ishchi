package uz.ishchi.app.search.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import uz.ishchi.app.common.JobType;

import java.math.BigDecimal;

public record SavedSearchRequest(
        @NotBlank @Size(max = 100) String name,
        Long professionId,
        Long regionId,
        Long districtId,
        JobType jobType,
        @DecimalMin(value = "0.0", inclusive = false) BigDecimal minPayment,
        /** Named around Object.notify(), which a record component may not shadow. */
        Boolean notifyEnabled
) {
}
