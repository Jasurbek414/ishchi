package uz.ishchi.app.auth;

public interface OtpService {

    /**
     * Generates (or mocks) an OTP code and "sends" it to the given phone.
     * Real SMS providers can replace {@link MockOtpService} without touching callers.
     */
    String generateAndSend(String phone);
}
