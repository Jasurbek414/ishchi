package uz.ishchi.app.wallet.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AdminAdjustRequest(
        /** Positive to credit the wallet, negative to debit it. */
        @NotNull BigDecimal amount,
        @Size(max = 500) String note
) {
}
