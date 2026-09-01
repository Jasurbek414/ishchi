package uz.ishchi.app.wallet.dto;

import uz.ishchi.app.common.TransactionType;
import uz.ishchi.app.wallet.WalletTransaction;

import java.math.BigDecimal;
import java.time.Instant;

public record TransactionResponse(
        Long id,
        TransactionType type,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String note,
        Instant createdAt
) {
    public static TransactionResponse from(WalletTransaction tx) {
        return new TransactionResponse(
                tx.getId(), tx.getType(), tx.getAmount(), tx.getBalanceAfter(), tx.getNote(), tx.getCreatedAt()
        );
    }
}
