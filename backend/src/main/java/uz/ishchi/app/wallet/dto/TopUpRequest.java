package uz.ishchi.app.wallet.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record TopUpRequest(
        @NotNull @DecimalMin(value = "1000", message = "Minimal to'ldirish summasi 1000 so'm") BigDecimal amount
) {
}
