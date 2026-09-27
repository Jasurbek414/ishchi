package uz.ishchi.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.otp.*}. The TTL used to be a hard-coded constant in AuthService while this
 * property sat in application.yml doing nothing — changing the yml had no effect at all.
 */
@ConfigurationProperties(prefix = "app.otp")
public record OtpProperties(Integer ttlMinutes) {

    public int ttlMinutesOrDefault() {
        return ttlMinutes != null && ttlMinutes > 0 ? ttlMinutes : 10;
    }
}
