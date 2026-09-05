package uz.ishchi.app.wallet.dto;

import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.TransactionType;
import uz.ishchi.app.wallet.WalletTransaction;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminTransactionResponse(
        Long id,
        TransactionType type,
        BigDecimal amount,
        BigDecimal balanceAfter,
        String note,
        Instant createdAt,
        Long userId,
        String userPhone,
        String userFullName,
        Role userRole
) {
    public static AdminTransactionResponse from(WalletTransaction tx, String userFullName) {
        var user = tx.getWallet().getUser();
        return new AdminTransactionResponse(
                tx.getId(), tx.getType(), tx.getAmount(), tx.getBalanceAfter(), tx.getNote(), tx.getCreatedAt(),
                user.getId(), user.getPhone(), userFullName, user.getRole()
        );
    }
}
