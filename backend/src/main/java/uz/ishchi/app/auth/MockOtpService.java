package uz.ishchi.app.auth;

import org.springframework.stereotype.Service;

/**
 * Placeholder SMS integration: always issues "1234" instead of calling a real
 * SMS provider. Swap this bean out for a real implementation of {@link OtpService}
 * when an SMS gateway (e.g. Eskiz.uz) is connected.
 */
@Service
public class MockOtpService implements OtpService {

    private static final String FIXED_CODE = "1234";

    @Override
    public String generateAndSend(String phone) {
        return FIXED_CODE;
    }
}
