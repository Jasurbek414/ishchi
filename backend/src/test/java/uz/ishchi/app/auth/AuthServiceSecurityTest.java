package uz.ishchi.app.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import uz.ishchi.app.common.OtpPurpose;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.config.OtpProperties;
import uz.ishchi.app.auth.dto.PhoneRequest;
import uz.ishchi.app.auth.dto.ResetPasswordRequest;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.security.JwtService;
import uz.ishchi.app.telegram.TelegramService;
import uz.ishchi.app.user.RefreshTokenRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;
import uz.ishchi.app.wallet.WalletService;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceSecurityTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private OtpCodeRepository otpCodeRepository;
    @Mock private OtpService otpService;
    @Spy private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    @Mock private JwtService jwtService;
    @Mock private RegionRepository regionRepository;
    @Mock private DistrictRepository districtRepository;
    @Mock private WorkerProfileRepository workerProfileRepository;
    @Mock private EmployerProfileRepository employerProfileRepository;
    @Mock private ProfessionRepository professionRepository;
    @Mock private WalletService walletService;
    @Mock private TelegramService telegramService;
    @Mock private OtpAttemptTracker otpAttemptTracker;

    private AuthService authService;
    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, refreshTokenRepository, otpCodeRepository, otpService,
                passwordEncoder, jwtService, regionRepository, districtRepository, workerProfileRepository,
                employerProfileRepository, professionRepository, walletService, telegramService,
                new OtpProperties(10), otpAttemptTracker);

        user = new User("+998901234567", passwordEncoder.encode("oldPassword1"), Role.WORKER);
        ReflectionTestUtils.setField(user, "id", 7L);
    }

    private OtpCode liveCode(String code) {
        OtpCode otp = new OtpCode("+998901234567", code, OtpPurpose.RESET_PASSWORD,
                Instant.now().plus(5, ChronoUnit.MINUTES));
        ReflectionTestUtils.setField(otp, "id", 99L);
        return otp;
    }

    @Test
    void aWrongCodeIsCountedSoGuessingCannotContinueForever() {
        when(userRepository.findByPhone("+998901234567")).thenReturn(Optional.of(user));
        when(otpCodeRepository.findTopByPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.of(liveCode("1234")));
        when(otpAttemptTracker.recordFailure(99L)).thenReturn(1);

        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest("+998901234567", "9999", "newPassword1")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("noto'g'ri");

        verify(otpAttemptTracker).recordFailure(99L);
    }

    @Test
    void theCodeIsBurnedOnceTheCapIsReached() {
        when(userRepository.findByPhone("+998901234567")).thenReturn(Optional.of(user));
        when(otpCodeRepository.findTopByPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(anyString(), any()))
                .thenReturn(Optional.of(liveCode("1234")));
        when(otpAttemptTracker.recordFailure(99L)).thenReturn(OtpCode.MAX_ATTEMPTS);

        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest("+998901234567", "9999", "newPassword1")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Yangi kod so'rang");
    }

    @Test
    void anUnknownPhoneLooksExactlyLikeAWrongCode() {
        // Answering 404 only for unregistered numbers told anyone who asked which ones have accounts.
        when(userRepository.findByPhone("+998900000000")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword(
                new ResetPasswordRequest("+998900000000", "1234", "newPassword1")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Tasdiqlash kodi noto'g'ri");
    }

    @Test
    void anUnknownPhoneGetsTheSameShapedForgotPasswordAnswer() {
        when(userRepository.findByPhone("+998900000000")).thenReturn(Optional.empty());
        when(telegramService.isConfigured()).thenReturn(true);
        when(telegramService.generateLinkToken()).thenReturn("decoy-token");
        when(telegramService.buildLinkUrl("decoy-token")).thenReturn("https://t.me/bot?start=decoy-token");

        var response = authService.forgotPassword(new PhoneRequest("+998900000000"));

        assertThat(response.telegramLinkUrl()).isEqualTo("https://t.me/bot?start=decoy-token");
        // The decoy token is never persisted, so the link cannot actually link anything.
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void linkStatusDoesNotRevealWhetherThePhoneIsRegistered() {
        when(userRepository.findByPhone("+998900000000")).thenReturn(Optional.empty());

        assertThat(authService.telegramLinkStatus("+998900000000").linked()).isFalse();
    }

    @Test
    void changingAPasswordRequiresTheCurrentOne() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.changePassword(user, "wrongPassword", "newPassword1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Joriy parol");
        verify(refreshTokenRepository, never()).revokeAllForUser(anyLong());
    }

    @Test
    void changingAPasswordSignsOtherSessionsOut() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        authService.changePassword(user, "oldPassword1", "newPassword1");

        assertThat(passwordEncoder.matches("newPassword1", user.getPasswordHash())).isTrue();
        verify(refreshTokenRepository).revokeAllForUser(7L);
    }

    @Test
    void aNoOpPasswordChangeIsRejected() {
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.changePassword(user, "oldPassword1", "oldPassword1"))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("farq qilishi");
    }
}
