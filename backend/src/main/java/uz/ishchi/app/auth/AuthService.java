package uz.ishchi.app.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.auth.dto.*;
import uz.ishchi.app.common.OtpPurpose;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.config.OtpProperties;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.profession.Profession;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.profile.EmployerProfile;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.security.AuthThrottle;
import uz.ishchi.app.security.JwtService;
import uz.ishchi.app.security.TokenHasher;
import uz.ishchi.app.telegram.TelegramService;
import uz.ishchi.app.user.RefreshToken;
import uz.ishchi.app.user.RefreshTokenRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;
import uz.ishchi.app.wallet.WalletService;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ProfessionRepository professionRepository;
    private final WalletService walletService;
    private final TelegramService telegramService;
    private final OtpProperties otpProperties;
    private final OtpAttemptTracker otpAttemptTracker;
    private final AuthThrottle authThrottle;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public OtpDispatchResponse register(RegisterRequest request) {
        if (request.role() == Role.ADMIN) {
            throw ApiException.badRequest("Administrator sifatida ro'yxatdan o'tib bo'lmaydi");
        }
        if (userRepository.existsByPhone(request.phone())) {
            throw ApiException.conflict("Bu telefon raqam bilan foydalanuvchi allaqachon mavjud");
        }

        Region region = regionRepository.findById(request.regionId())
                .orElseThrow(() -> ApiException.badRequest("Viloyat topilmadi"));
        District district = districtRepository.findById(request.districtId())
                .orElseThrow(() -> ApiException.badRequest("Tuman/shahar topilmadi"));
        if (!district.getRegion().getId().equals(region.getId())) {
            throw ApiException.badRequest("Tanlangan tuman ushbu viloyatga tegishli emas");
        }

        // After the cheap validation above, so a malformed request does not burn the phone's allowance.
        authThrottle.acquireOtpSend(request.phone());

        User user = new User(request.phone(), passwordEncoder.encode(request.password()), request.role());
        user = userRepository.save(user);

        if (request.role() == Role.WORKER) {
            WorkerProfile profile = new WorkerProfile();
            profile.setUser(user);
            profile.setFirstName(request.firstName());
            profile.setLastName(request.lastName());
            profile.setRegion(region);
            profile.setDistrict(district);
            workerProfileRepository.save(profile);
        } else {
            EmployerProfile profile = new EmployerProfile();
            profile.setUser(user);
            profile.setFirstName(request.firstName());
            profile.setLastName(request.lastName());
            profile.setRegion(region);
            profile.setDistrict(district);
            employerProfileRepository.save(profile);
        }

        walletService.createForUser(user);

        return dispatchOtp(user, OtpPurpose.REGISTER);
    }

    @Transactional
    public OtpDispatchResponse resendOtp(PhoneRequest request) {
        // Before the lookup, and for unknown numbers too, so the limit says nothing about who exists.
        authThrottle.acquireOtpSend(request.phone());
        return userRepository.findByPhone(request.phone())
                .map(user -> dispatchOtp(user, OtpPurpose.REGISTER))
                .orElseGet(() -> decoyDispatch(OtpPurpose.REGISTER));
    }

    @Transactional(readOnly = true)
    public LinkStatusResponse telegramLinkStatus(String phone) {
        return new LinkStatusResponse(userRepository.findByPhone(phone)
                .map(user -> user.getTelegramChatId() != null)
                .orElse(false));
    }

    @Transactional
    public MessageResponse verifyOtp(VerifyOtpRequest request) {
        authThrottle.checkOtpVerify(request.phone());
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> ApiException.badRequest("Tasdiqlash kodi noto'g'ri"));
        if (user.isVerified()) {
            return new MessageResponse("Telefon raqam allaqachon tasdiqlangan");
        }
        consumeOtp(request.phone(), request.code(), OtpPurpose.REGISTER);
        user.setVerified(true);
        return new MessageResponse("Telefon raqam muvaffaqiyatli tasdiqlandi");
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Per account, not per caller address: a password can only be guessed so many times however
        // many addresses the guesses come from. Unknown numbers count too, so this reveals nothing.
        authThrottle.checkLogin(request.phone());

        User user = userRepository.findByPhone(request.phone()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            authThrottle.recordLoginFailure(request.phone());
            throw ApiException.unauthorized("Telefon raqam yoki parol noto'g'ri", "INVALID_CREDENTIALS");
        }
        authThrottle.clearLogin(request.phone());
        if (!user.isActive()) {
            throw ApiException.forbidden("Akkauntingiz bloklangan", "ACCOUNT_BLOCKED");
        }
        if (!user.isVerified()) {
            throw ApiException.forbidden("Avval telefon raqamingizni tasdiqlang", "ACCOUNT_NOT_VERIFIED");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest request) {
        String hash = TokenHasher.hash(request.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> ApiException.unauthorized("Refresh token yaroqsiz"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("Refresh token muddati tugagan");
        }

        stored.setRevoked(true);
        User user = stored.getUser();
        if (!user.isActive()) {
            throw ApiException.forbidden("Akkauntingiz bloklangan", "ACCOUNT_BLOCKED");
        }
        if (!user.isVerified()) {
            throw ApiException.forbidden("Avval telefon raqamingizni tasdiqlang", "ACCOUNT_NOT_VERIFIED");
        }
        return issueTokens(user);
    }

    @Transactional
    public MessageResponse logout(RefreshRequest request) {
        String hash = TokenHasher.hash(request.refreshToken());
        refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .ifPresent(rt -> rt.setRevoked(true));
        return new MessageResponse("Tizimdan chiqildi");
    }

    @Transactional
    public OtpDispatchResponse forgotPassword(PhoneRequest request) {
        authThrottle.acquireOtpSend(request.phone());
        return userRepository.findByPhone(request.phone())
                .map(user -> dispatchOtp(user, OtpPurpose.RESET_PASSWORD))
                .orElseGet(() -> decoyDispatch(OtpPurpose.RESET_PASSWORD));
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        authThrottle.checkOtpVerify(request.phone());
        User user = userRepository.findByPhone(request.phone())
                .orElseThrow(() -> ApiException.badRequest("Tasdiqlash kodi noto'g'ri"));
        consumeOtp(request.phone(), request.code(), OtpPurpose.RESET_PASSWORD);
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        refreshTokenRepository.revokeAllForUser(user.getId());
        return new MessageResponse("Parol muvaffaqiyatli yangilandi");
    }

    /**
     * Decides how to get an OTP to the user: falls back to the mock "1234" (no Telegram
     * configured yet), asks the client to link Telegram first (configured, not yet linked), or
     * sends a real code straight to their linked chat.
     */
    private OtpDispatchResponse dispatchOtp(User user, OtpPurpose purpose) {
        if (!telegramService.isConfigured()) {
            String code = otpService.generateAndSend(user.getPhone());
            saveOtpCode(user.getPhone(), code, purpose);
            return new OtpDispatchResponse(defaultMessage(purpose), null);
        }
        if (user.getTelegramChatId() == null) {
            String linkToken = telegramService.generateLinkToken();
            user.setTelegramLinkToken(linkToken);
            user.setTelegramLinkPurpose(purpose);
            userRepository.save(user);
            String linkUrl = telegramService.buildLinkUrl(linkToken);
            return new OtpDispatchResponse("Davom etish uchun Telegram botimizni oching", linkUrl);
        }
        sendViaTelegram(user, purpose);
        return new OtpDispatchResponse(defaultMessage(purpose), null);
    }

    /**
     * Changes the password of the signed-in account after checking the current one, and revokes
     * every refresh token so any other session is signed out.
     */
    @Transactional
    public MessageResponse changePassword(User user, String currentPassword, String newPassword) {
        User stored = userRepository.findById(user.getId())
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
        if (!passwordEncoder.matches(currentPassword, stored.getPasswordHash())) {
            throw ApiException.badRequest("Joriy parol noto'g'ri", "INVALID_CURRENT_PASSWORD");
        }
        if (passwordEncoder.matches(newPassword, stored.getPasswordHash())) {
            throw ApiException.badRequest("Yangi parol joriy paroldan farq qilishi kerak");
        }
        stored.setPasswordHash(passwordEncoder.encode(newPassword));
        refreshTokenRepository.revokeAllForUser(stored.getId());
        return new MessageResponse("Parol muvaffaqiyatli o'zgartirildi");
    }

    /**
     * The same-shaped answer for a phone number nobody is registered with. Answering 404 only in
     * that case told anyone who asked which numbers have accounts; when Telegram is configured
     * the decoy carries a bot link too, so the two cases look identical from outside. The token
     * in it is never stored, so the link cannot link anything.
     */
    private OtpDispatchResponse decoyDispatch(OtpPurpose purpose) {
        if (!telegramService.isConfigured()) {
            return new OtpDispatchResponse(defaultMessage(purpose), null);
        }
        return new OtpDispatchResponse("Davom etish uchun Telegram botimizni oching",
                telegramService.buildLinkUrl(telegramService.generateLinkToken()));
    }

    /** Called by the Telegram webhook right after a user finishes linking their chat. */
    @Transactional
    public void sendPendingOtpAfterTelegramLink(User user, OtpPurpose purpose) {
        if (purpose == null) return;
        sendViaTelegram(user, purpose);
    }

    private void sendViaTelegram(User user, OtpPurpose purpose) {
        String code = String.valueOf(1000 + RANDOM.nextInt(9000));
        telegramService.sendOtp(user.getTelegramChatId(), code);
        saveOtpCode(user.getPhone(), code, purpose);
    }

    private String defaultMessage(OtpPurpose purpose) {
        return purpose == OtpPurpose.REGISTER
                ? "Ro'yxatdan o'tish muvaffaqiyatli. Yuborilgan kodni tasdiqlang"
                : "Parolni tiklash kodi yuborildi";
    }

    private void saveOtpCode(String phone, String code, OtpPurpose purpose) {
        OtpCode otp = new OtpCode(phone, code, purpose,
                Instant.now().plus(otpProperties.ttlMinutesOrDefault(), ChronoUnit.MINUTES));
        otpCodeRepository.save(otp);
    }

    private void consumeOtp(String phone, String code, OtpPurpose purpose) {
        OtpCode otp = otpCodeRepository.findTopByPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(phone, purpose)
                .orElseThrow(() -> ApiException.badRequest("Tasdiqlash kodi topilmadi, qaytadan so'rang"));
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("Tasdiqlash kodi muddati tugagan, qaytadan so'rang");
        }
        if (!otp.getCode().equals(code)) {
            authThrottle.recordOtpVerifyFailure(phone);
            int attempts = otpAttemptTracker.recordFailure(otp.getId());
            if (attempts >= OtpCode.MAX_ATTEMPTS) {
                throw ApiException.badRequest("Kod bir necha marta xato kiritildi. Yangi kod so'rang");
            }
            throw ApiException.badRequest("Tasdiqlash kodi noto'g'ri");
        }
        otp.setUsed(true);
    }

    /**
     * Toggles the account between WORKER and EMPLOYER, so the same person can both look for
     * work and post jobs. Both profiles persist independently — switching back later restores
     * whatever was there before. The first time a profile of the target role is needed, it's
     * bootstrapped from the shared fields (name, avatar, region, district, about) already on
     * the existing profile, so nothing is re-entered.
     */
    @Transactional
    public AuthResponse switchRole(User user, List<Long> professionIds) {
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.badRequest("Administrator rolini almashtira olmaydi");
        }
        Role targetRole = user.getRole() == Role.WORKER ? Role.EMPLOYER : Role.WORKER;

        if (targetRole == Role.EMPLOYER && employerProfileRepository.findByUserId(user.getId()).isEmpty()) {
            WorkerProfile source = workerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));
            EmployerProfile profile = new EmployerProfile();
            profile.setUser(user);
            profile.setFirstName(source.getFirstName());
            profile.setLastName(source.getLastName());
            profile.setAvatarUrl(source.getAvatarUrl());
            profile.setRegion(source.getRegion());
            profile.setDistrict(source.getDistrict());
            profile.setAbout(source.getAbout());
            profile.setLatitude(source.getLatitude());
            profile.setLongitude(source.getLongitude());
            employerProfileRepository.save(profile);
        } else if (targetRole == Role.WORKER && workerProfileRepository.findByUserId(user.getId()).isEmpty()) {
            EmployerProfile source = employerProfileRepository.findByUserId(user.getId())
                    .orElseThrow(() -> ApiException.notFound("Profil topilmadi"));
            WorkerProfile profile = new WorkerProfile();
            profile.setUser(user);
            profile.setFirstName(source.getFirstName());
            profile.setLastName(source.getLastName());
            profile.setAvatarUrl(source.getAvatarUrl());
            profile.setRegion(source.getRegion());
            profile.setDistrict(source.getDistrict());
            profile.setAbout(source.getAbout());
            profile.setLatitude(source.getLatitude());
            profile.setLongitude(source.getLongitude());
            if (professionIds != null && !professionIds.isEmpty()) {
                List<Profession> professions = professionRepository.findAllById(professionIds);
                if (professions.size() != new HashSet<>(professionIds).size()) {
                    throw ApiException.badRequest("Tanlangan kasblardan biri topilmadi");
                }
                profile.setProfessions(new HashSet<>(professions));
            }
            workerProfileRepository.save(profile);
        }

        // `user` comes from the JWT filter's out-of-transaction lookup, so it's detached —
        // an explicit save() (merge) is required here; plain dirty-checking would silently
        // not persist the role change.
        user.setRole(targetRole);
        user = userRepository.save(user);
        return issueTokens(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getPhone(), user.getRole());
        String rawRefreshToken = TokenHasher.generateRawToken();
        RefreshToken refreshToken = new RefreshToken(
                user,
                TokenHasher.hash(rawRefreshToken),
                Instant.now().plus(jwtService.refreshTokenTtlDays(), ChronoUnit.DAYS)
        );
        refreshTokenRepository.save(refreshToken);
        return new AuthResponse(accessToken, rawRefreshToken, user.getId(), user.getRole());
    }
}
