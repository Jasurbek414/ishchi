package uz.ishchi.app.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import uz.ishchi.app.common.exception.ApiException;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limits keyed by the PHONE NUMBER being attacked rather than by the caller's address.
 *
 * <p>{@link RateLimitFilter} caps requests per client address, which an attacker with many
 * addresses (or, until it was fixed, a forged header) simply steps around. These limits follow the
 * account instead: a password or a 4-digit code can only be guessed so many times per hour however
 * many addresses the guesses come from. The keys are applied to unknown phone numbers exactly as to
 * known ones, so the limits do not reveal whether an account exists.
 *
 * <p>Trade-off, accepted: someone can deliberately burn a victim's allowance and make them wait.
 * The victim can still reset the password (a separate allowance), and the wait is minutes, whereas
 * the alternative was unlimited guessing against every account including the administrator's.
 *
 * <p>In-memory, like the filter: one backend container today. Move it to a shared store if the
 * backend is ever scaled out.
 */
@Component
public class AuthThrottle {

    static final int LOGIN_MAX_FAILURES = 10;
    static final Duration LOGIN_WINDOW = Duration.ofMinutes(15);

    static final int OTP_VERIFY_MAX_FAILURES = 10;
    static final Duration OTP_VERIFY_WINDOW = Duration.ofHours(1);

    static final int OTP_SEND_MAX = 5;
    static final Duration OTP_SEND_WINDOW = Duration.ofHours(1);
    static final Duration OTP_SEND_MIN_GAP = Duration.ofSeconds(30);

    private static final int MAX_TRACKED_KEYS = 100_000;
    private static final Duration LONGEST_WINDOW = Duration.ofHours(1);

    private final Clock clock;
    private final Map<String, Deque<Long>> events = new ConcurrentHashMap<>();

    @Autowired
    public AuthThrottle() {
        this(Clock.systemUTC());
    }

    AuthThrottle(Clock clock) {
        this.clock = clock;
    }

    /** Throws 429 while this phone has used up its wrong-password allowance. */
    public void checkLogin(String phone) {
        rejectIfFull("login", phone, LOGIN_MAX_FAILURES, LOGIN_WINDOW);
    }

    public void recordLoginFailure(String phone) {
        add("login", phone, LOGIN_WINDOW);
    }

    /** The right password was given, so earlier typos no longer count against the account. */
    public void clearLogin(String phone) {
        events.remove(key("login", phone));
    }

    /** Throws 429 while this phone has used up its wrong-code allowance (across all its codes). */
    public void checkOtpVerify(String phone) {
        rejectIfFull("otp-verify", phone, OTP_VERIFY_MAX_FAILURES, OTP_VERIFY_WINDOW);
    }

    public void recordOtpVerifyFailure(String phone) {
        add("otp-verify", phone, OTP_VERIFY_WINDOW);
    }

    /**
     * Takes one slot for sending a code to this phone, or throws 429: no more than one every 30
     * seconds and five an hour. Each send is a Telegram message to the person who owns the number,
     * and each fresh code is a fresh set of guesses, so both are worth bounding.
     */
    public void acquireOtpSend(String phone) {
        Deque<Long> sends = deque("otp-send", phone);
        long now = clock.millis();
        synchronized (sends) {
            prune(sends, now, OTP_SEND_WINDOW);
            Long last = sends.peekLast();
            if (last != null && now - last < OTP_SEND_MIN_GAP.toMillis()) {
                long wait = Math.max(1, (OTP_SEND_MIN_GAP.toMillis() - (now - last) + 999) / 1000);
                throw ApiException.tooManyRequests("Kodni qayta so'rash uchun " + wait + " soniya kuting", "OTP_TOO_SOON");
            }
            if (sends.size() >= OTP_SEND_MAX) {
                long wait = secondsUntilFree(sends, now, OTP_SEND_WINDOW);
                throw ApiException.tooManyRequests("Bir soatda ko'pi bilan " + OTP_SEND_MAX
                        + " marta kod so'rash mumkin. " + minutes(wait) + " daqiqadan keyin urinib ko'ring", "OTP_LIMIT");
            }
            sends.addLast(now);
        }
        pruneIfCrowded(now);
    }

    private void rejectIfFull(String kind, String phone, int max, Duration window) {
        Deque<Long> failures = events.get(key(kind, phone));
        if (failures == null) {
            return;
        }
        long now = clock.millis();
        synchronized (failures) {
            prune(failures, now, window);
            if (failures.size() >= max) {
                throw ApiException.tooManyRequests("Juda ko'p muvaffaqiyatsiz urinish. "
                        + minutes(secondsUntilFree(failures, now, window)) + " daqiqadan keyin qayta urinib ko'ring",
                        "TOO_MANY_ATTEMPTS");
            }
        }
    }

    private void add(String kind, String phone, Duration window) {
        Deque<Long> failures = deque(kind, phone);
        long now = clock.millis();
        synchronized (failures) {
            prune(failures, now, window);
            failures.addLast(now);
        }
        pruneIfCrowded(now);
    }

    private Deque<Long> deque(String kind, String phone) {
        return events.computeIfAbsent(key(kind, phone), k -> new ArrayDeque<>());
    }

    private static String key(String kind, String phone) {
        return kind + '|' + (phone == null ? "" : phone.trim());
    }

    private static void prune(Deque<Long> times, long now, Duration window) {
        long cutoff = now - window.toMillis();
        while (!times.isEmpty() && times.peekFirst() <= cutoff) {
            times.pollFirst();
        }
    }

    private static long secondsUntilFree(Deque<Long> times, long now, Duration window) {
        Long oldest = times.peekFirst();
        return oldest == null ? 1 : Math.max(1, (oldest + window.toMillis() - now + 999) / 1000);
    }

    private static long minutes(long seconds) {
        return Math.max(1, (seconds + 59) / 60);
    }

    /** Keeps the map from growing without bound when many distinct numbers show up. */
    private void pruneIfCrowded(long now) {
        if (events.size() > MAX_TRACKED_KEYS) {
            events.values().removeIf(d -> {
                synchronized (d) {
                    prune(d, now, LONGEST_WINDOW);
                    return d.isEmpty();
                }
            });
        }
    }
}
