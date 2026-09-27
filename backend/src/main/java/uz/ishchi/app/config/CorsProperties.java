package uz.ishchi.app.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.List;

/**
 * Binds {@code app.cors.allowed-origins}. The value used to be ignored entirely — SecurityConfig
 * hard-coded {@code "*"}, so setting CORS_ALLOWED_ORIGINS in the environment did nothing.
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(String allowedOrigins) {

    /** Comma-separated list, or {@code *} for "any origin". Blank behaves like {@code *}. */
    public List<String> originPatterns() {
        if (allowedOrigins == null || allowedOrigins.isBlank()) {
            return List.of("*");
        }
        List<String> patterns = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        return patterns.isEmpty() ? List.of("*") : patterns;
    }
}
