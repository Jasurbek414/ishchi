package uz.ishchi.app.wallet;

import java.math.BigDecimal;

/**
 * Abstraction over the payment provider used to fund a wallet.
 * {@link MockPaymentGatewayService} always approves instantly; swap in a real
 * Payme/Click implementation later without touching {@link WalletService}.
 */
public interface PaymentGatewayService {

    PaymentResult charge(Long userId, BigDecimal amount);

    record PaymentResult(boolean approved, String providerReference) {
    }
}
