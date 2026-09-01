package uz.ishchi.app.wallet;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Placeholder payment gateway: always approves the charge instantly instead of calling a
 * real provider. Swap this bean out for a Payme/Click implementation of {@link PaymentGatewayService}
 * when a merchant account is connected.
 */
@Service
public class MockPaymentGatewayService implements PaymentGatewayService {

    @Override
    public PaymentResult charge(Long userId, BigDecimal amount) {
        return new PaymentResult(true, "MOCK-" + UUID.randomUUID());
    }
}
