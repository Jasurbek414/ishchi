package uz.ishchi.app.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import uz.ishchi.app.common.exception.ErrorResponse;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window request cap for the endpoints worth abusing: credential and OTP checks (guessing),
 * OTP dispatch (Telegram flooding and junk accounts), and the banner impression counters (stat
 * stuffing). None of these had any cap, so a 4-digit OTP and a password were both open to
 * unlimited guessing.
 *
 * <p>Deliberately dependency-free and in-memory: the deployment is a single backend container, so
 * a shared store would add moving parts for no gain today. If the backend is ever scaled out this
 * has to move to Redis, since each replica would otherwise keep its own allowance.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String pathPrefix, int maxRequests, Duration window) {
    }

    /** First match wins, so the more specific prefixes come first. */
    private static final List<Rule> RULES = List.of(
            new Rule("/api/auth/login", 10, Duration.ofMinutes(5)),
            new Rule("/api/auth/verify-otp", 10, Duration.ofMinutes(5)),
            new Rule("/api/auth/reset-password", 10, Duration.ofMinutes(5)),
            new Rule("/api/auth/register", 5, Duration.ofMinutes(15)),
            new Rule("/api/auth/resend-otp", 5, Duration.ofMinutes(15)),
            new Rule("/api/auth/forgot-password", 5, Duration.ofMinutes(15)),
            new Rule("/api/auth/telegram-link-status", 120, Duration.ofMinutes(5)),
            new Rule("/api/profile/change-password", 10, Duration.ofMinutes(5)),
            new Rule("/api/promo-banners", 120, Duration.ofMinutes(1)),
            // Worker detail is the only endpoint that still serves a phone number, so cap how
            // fast one account can walk it. A paywall or consent step would close this properly,
            // but that needs a product decision and a client change.
            new Rule("/api/workers", 200, Duration.ofMinutes(10))
    );

    private static final int MAX_TRACKED_KEYS = 100_000;

    private static final class Window {
        private final Instant resetAt;
        private final AtomicInteger count = new AtomicInteger();

        private Window(Instant resetAt) {
            this.resetAt = resetAt;
        }
    }

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public RateLimitFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        Rule rule = ruleFor(request);
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = rule.pathPrefix() + '|' + clientIp(request);
        Instant now = Instant.now();
        Window window = windows.compute(key, (k, existing) ->
                existing == null || !existing.resetAt.isAfter(now) ? new Window(now.plus(rule.window())) : existing);

        if (window.count.incrementAndGet() > rule.maxRequests()) {
            long retryAfter = Math.max(1, Duration.between(now, window.resetAt).getSeconds());
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getWriter(), ErrorResponse.of(429, "Too Many Requests",
                    "Juda ko'p urinish. " + retryAfter + " soniyadan keyin qayta urinib ko'ring",
                    "RATE_LIMITED"));
            return;
        }

        pruneIfCrowded(now);
        filterChain.doFilter(request, response);
    }

    private Rule ruleFor(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return null;
        }
        // Reading banners is free; only the counters that can be stuffed are capped.
        if (path.startsWith("/api/promo-banners") && !path.endsWith("/view") && !path.endsWith("/click")) {
            return null;
        }
        return RULES.stream().filter(r -> path.startsWith(r.pathPrefix())).findFirst().orElse(null);
    }

    /**
     * The backend sits behind a Cloudflare tunnel that sets X-Forwarded-For, so the left-most
     * entry is the real client. Falls back to the socket address when the header is absent (direct
     * access), which is also what makes this safe to spoof only from inside the network.
     */
    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }

    /** Keeps the map from growing without bound when many distinct IPs show up. */
    private void pruneIfCrowded(Instant now) {
        if (windows.size() > MAX_TRACKED_KEYS) {
            windows.values().removeIf(w -> !w.resetAt.isAfter(now));
        }
    }
}
