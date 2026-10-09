package uz.ishchi.app.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uz.ishchi.app.common.exception.ApiException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The per-account limits that stop password and code guessing from many addresses (the per-address
 * filter alone could be stepped around).
 */
class AuthThrottleTest {

    private static final String PHONE = "+998901234567";

    private final MutableClock clock = new MutableClock();
    private AuthThrottle throttle;

    @BeforeEach
    void setUp() {
        throttle = new AuthThrottle(clock);
    }

    @Test
    void locksTheAccountAfterTenWrongPasswordsAndSaysTheWaitInMinutes() {
        for (int i = 0; i < 10; i++) {
            throttle.checkLogin(PHONE);
            throttle.recordLoginFailure(PHONE);
        }

        assertThatThrownBy(() -> throttle.checkLogin(PHONE))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus().value()).isEqualTo(429);
                    assertThat(e.getCode()).isEqualTo("TOO_MANY_ATTEMPTS");
                    assertThat(e.getMessage()).contains("15 daqiqadan");
                });
    }

    @Test
    void theLockExpiresWithTheWindow() {
        for (int i = 0; i < 10; i++) {
            throttle.recordLoginFailure(PHONE);
        }
        clock.advance(Duration.ofMinutes(16));

        assertThatCode(() -> throttle.checkLogin(PHONE)).doesNotThrowAnyException();
    }

    @Test
    void theRightPasswordForgetsEarlierTypos() {
        for (int i = 0; i < 9; i++) {
            throttle.recordLoginFailure(PHONE);
        }
        throttle.clearLogin(PHONE);
        for (int i = 0; i < 9; i++) {
            throttle.recordLoginFailure(PHONE);
        }

        assertThatCode(() -> throttle.checkLogin(PHONE)).doesNotThrowAnyException();
    }

    @Test
    void oneAccountLockedDoesNotLockAnother() {
        for (int i = 0; i < 10; i++) {
            throttle.recordLoginFailure(PHONE);
        }

        assertThatCode(() -> throttle.checkLogin("+998907654321")).doesNotThrowAnyException();
    }

    @Test
    void wrongCodesAreCountedPerPhoneAcrossAllItsCodes() {
        for (int i = 0; i < 10; i++) {
            throttle.checkOtpVerify(PHONE);
            throttle.recordOtpVerifyFailure(PHONE);
        }

        assertThatThrownBy(() -> throttle.checkOtpVerify(PHONE))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus().value()).isEqualTo(429));
    }

    @Test
    void codeRequestsNeedAGapAndAreCappedPerHour() {
        throttle.acquireOtpSend(PHONE);

        // A second request straight away is too soon.
        assertThatThrownBy(() -> throttle.acquireOtpSend(PHONE))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getCode()).isEqualTo("OTP_TOO_SOON"));

        // Five in the hour, spaced out as a real user would, then the sixth is refused.
        for (int i = 0; i < 4; i++) {
            clock.advance(Duration.ofSeconds(31));
            throttle.acquireOtpSend(PHONE);
        }
        clock.advance(Duration.ofSeconds(31));
        assertThatThrownBy(() -> throttle.acquireOtpSend(PHONE))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getCode()).isEqualTo("OTP_LIMIT"));

        // The hour passes and requests work again.
        clock.advance(Duration.ofHours(1));
        assertThatCode(() -> throttle.acquireOtpSend(PHONE)).doesNotThrowAnyException();
    }

    @Test
    void unknownNumbersAreLimitedExactlyLikeKnownOnes() {
        // Same keys, same limits: nothing here depends on whether the account exists.
        String ghost = "+998900000000";
        for (int i = 0; i < 10; i++) {
            throttle.recordLoginFailure(ghost);
        }

        assertThatThrownBy(() -> throttle.checkLogin(ghost)).isInstanceOf(ApiException.class);
    }

    private static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-08T10:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
