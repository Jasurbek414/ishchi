package uz.ishchi.app.telephony.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AssignWorkerRequest(
        @NotNull(message = "Mutaxassis tanlanishi shart")
        Long workerId,

        BigDecimal priceAgreed,
        String notes
) {
}
