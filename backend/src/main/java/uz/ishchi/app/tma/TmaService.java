package uz.ishchi.app.tma;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.auth.OtpCode;
import uz.ishchi.app.auth.OtpCodeRepository;
import uz.ishchi.app.auth.dto.AuthResponse;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.OtpPurpose;
import uz.ishchi.app.common.PaymentType;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.job.JobSpecifications;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.location.dto.RegionResponse;
import uz.ishchi.app.profession.Profession;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.profession.dto.ProfessionResponse;
import uz.ishchi.app.profile.EmployerProfile;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.security.JwtService;
import uz.ishchi.app.settings.AppSettingsService;
import uz.ishchi.app.telegram.TelegramService;
import uz.ishchi.app.tma.dto.*;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;
import uz.ishchi.app.wallet.WalletService;
import uz.ishchi.app.worker.WorkerSpecifications;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TmaService {

    private static final Logger log = LoggerFactory.getLogger(TmaService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final AppSettingsService appSettingsService;
    private final UserRepository userRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final JobRepository jobRepository;
    private final ProfessionRepository professionRepository;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final OtpCodeRepository otpCodeRepository;
    private final TelegramService telegramService;
    private final WalletService walletService;
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Validates Telegram WebApp initData HMAC-SHA256 signature against the bot token.
     */
    public boolean verifyTelegramInitData(String initData, String botToken) {
        if (initData == null || initData.isBlank() || botToken == null || botToken.isBlank()) {
            return false;
        }
        try {
            Map<String, String> params = new TreeMap<>();
            String receivedHash = null;
            for (String pair : initData.split("&")) {
                int eq = pair.indexOf('=');
                if (eq > 0) {
                    String key = URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
                    String val = URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
                    if ("hash".equals(key)) {
                        receivedHash = val;
                    } else {
                        params.put(key, val);
                    }
                }
            }
            if (receivedHash == null) return false;

            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(entry.getKey()).append("=").append(entry.getValue());
            }

            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec("WebAppData".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] secretKey = hmac.doFinal(botToken.getBytes(StandardCharsets.UTF_8));

            Mac dataMac = Mac.getInstance("HmacSHA256");
            dataMac.init(new SecretKeySpec(secretKey, "HmacSHA256"));
            byte[] calculatedHashBytes = dataMac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8));

            String calculatedHex = HexFormat.of().formatHex(calculatedHashBytes);
            return MessageDigest.isEqual(calculatedHex.getBytes(StandardCharsets.UTF_8), receivedHash.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.warn("Telegram initData tekshirishda xatolik: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Authenticates or automatically provisions a user from Telegram Mini App.
     */
    @Transactional
    public AuthResponse authenticate(TmaAuthRequest request) {
        String token = appSettingsService.getTelegramBotToken();
        if (token == null || !verifyTelegramInitData(request.initData(), token)) {
            throw ApiException.unauthorized("Telegram ma'lumotlari haqiqiy emas yoki eskirgan");
        }

        try {
            String userJson = null;
            for (String pair : request.initData().split("&")) {
                if (pair.startsWith("user=")) {
                    userJson = URLDecoder.decode(pair.substring(5), StandardCharsets.UTF_8);
                    break;
                }
            }
            if (userJson == null) {
                throw ApiException.badRequest("Telegram foydalanuvchi ma'lumoti topilmadi");
            }

            JsonNode node = mapper.readTree(userJson);
            long telegramId = node.path("id").asLong();
            String firstName = node.path("first_name").asText("Foydalanuvchi");
            String lastName = node.path("last_name").asText("");
            String username = node.path("username").asText("");

            User user = userRepository.findByTelegramChatId(telegramId).orElseGet(() -> {
                // Auto-create user linked with this Telegram ID
                String phoneCandidate = "+998TG" + telegramId;
                if (phoneCandidate.length() > 20) {
                    phoneCandidate = phoneCandidate.substring(0, 20);
                }
                User fresh = new User();
                fresh.setPhone(phoneCandidate);
                fresh.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
                fresh.setRole(Role.EMPLOYER);
                fresh.setTelegramChatId(telegramId);
                fresh.setActive(true);
                fresh.setVerified(true);
                fresh.setRegistered(false); // Brand new user, needs onboarding
                fresh = userRepository.saveAndFlush(fresh);

                // Create initial employer profile
                EmployerProfile ep = new EmployerProfile();
                ep.setUser(fresh);
                ep.setFirstName(firstName);
                ep.setLastName(lastName);
                if (!username.isBlank()) {
                    ep.setAbout("Telegram: @" + username);
                }
                // default to first region & district
                Region defaultRegion = regionRepository.findAll().stream().findFirst().orElse(null);
                if (defaultRegion != null) {
                    ep.setRegion(defaultRegion);
                    District defaultDistrict = districtRepository.findByRegionIdOrderByNameAsc(defaultRegion.getId()).stream().findFirst().orElse(null);
                    if (defaultDistrict != null) {
                        ep.setDistrict(defaultDistrict);
                    }
                }
                employerProfileRepository.save(ep);
                return fresh;
            });

            String accessToken = jwtService.generateAccessToken(user.getId(), user.getPhone(), user.getRole());
            return new AuthResponse(accessToken, null, user.getId(), user.getRole());
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("TMA avtorizatsiya xatosi", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Tizimga kirishda xatolik yuz berdi");
        }
    }

    /**
     * Public search for workers (ustalar va ishchilar).
     */
    @Transactional(readOnly = true)
    public Page<TmaWorkerDto> searchWorkers(Long regionId, Long districtId, Long professionId, String search, Pageable pageable) {
        Specification<WorkerProfile> spec = Specification.where(WorkerSpecifications.activeUser());
        if (regionId != null) spec = spec.and(WorkerSpecifications.regionId(regionId));
        if (districtId != null) spec = spec.and(WorkerSpecifications.districtId(districtId));
        if (professionId != null) spec = spec.and(WorkerSpecifications.professionId(professionId));
        if (search != null && !search.isBlank()) spec = spec.and(WorkerSpecifications.search(search));

        Pageable effective = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "ratingAverage", "updatedAt"));

        return workerProfileRepository.findAll(spec, effective).map(this::toWorkerDto);
    }

    @Transactional(readOnly = true)
    public TmaWorkerDto getWorker(Long id) {
        WorkerProfile p = workerProfileRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ishchi topilmadi"));
        return toWorkerDto(p);
    }

    private TmaWorkerDto toWorkerDto(WorkerProfile p) {
        List<String> profNames = p.getProfessions().stream().map(Profession::getName).toList();
        return new TmaWorkerDto(
                p.getId(),
                p.getFullName(),
                p.getAvatarUrl(),
                p.getRegion() != null ? p.getRegion().getId() : null,
                p.getRegion() != null ? p.getRegion().getName() : null,
                p.getDistrict() != null ? p.getDistrict().getId() : null,
                p.getDistrict() != null ? p.getDistrict().getName() : null,
                p.getExperienceYears(),
                p.getRatingAverage(),
                p.getRatingCount(),
                p.isAvailable(),
                p.isVerified(),
                p.getUser() != null ? p.getUser().getPhone() : null,
                profNames,
                p.getAbout()
        );
    }

    /**
     * Search active jobs (buyurtmalar).
     */
    @Transactional(readOnly = true)
    public Page<TmaJobDto> searchJobs(Long regionId, Long districtId, Long professionId, String search, Pageable pageable) {
        Specification<Job> spec = Specification.where(JobSpecifications.notBlocked())
                .and(JobSpecifications.status(JobStatus.ACTIVE));
        if (regionId != null) spec = spec.and(JobSpecifications.regionId(regionId));
        if (districtId != null) spec = spec.and(JobSpecifications.districtId(districtId));
        if (professionId != null) spec = spec.and(JobSpecifications.professionId(professionId));

        Pageable effective = pageable.getSort().isSorted() ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));

        return jobRepository.findAll(spec, effective).map(this::toJobDto);
    }

    @Transactional(readOnly = true)
    public TmaJobDto getJob(Long id) {
        Job j = jobRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        return toJobDto(j);
    }

    private TmaJobDto toJobDto(Job j) {
        String phone = j.getEmployer() != null && j.getEmployer().getUser() != null ? j.getEmployer().getUser().getPhone() : null;
        String empName = j.getEmployer() != null ? j.getEmployer().getFullName() : null;

        return new TmaJobDto(
                j.getId(),
                j.getTitle(),
                j.getDescription(),
                j.getPayment(),
                j.getPaymentType() != null ? j.getPaymentType().name() : PaymentType.FIXED.name(),
                j.getProfession() != null ? j.getProfession().getId() : null,
                j.getProfession() != null ? j.getProfession().getName() : null,
                j.getRegion() != null ? j.getRegion().getId() : null,
                j.getRegion() != null ? j.getRegion().getName() : null,
                j.getDistrict() != null ? j.getDistrict().getId() : null,
                j.getDistrict() != null ? j.getDistrict().getName() : null,
                phone,
                empName,
                j.getCreatedAt(),
                j.getStatus() != null ? j.getStatus().name() : JobStatus.ACTIVE.name(),
                j.isUrgent()
        );
    }

    /**
     * Post a new job directly from Telegram Mini App.
     */
    @Transactional
    public TmaJobDto postJob(TmaPostJobRequest req, User currentUser) {
        if (req.title() == null || req.title().isBlank()) {
            throw ApiException.badRequest("Buyurtma sarlavhasi kiritilishi shart");
        }
        Profession profession = professionRepository.findById(req.professionId())
                .orElseThrow(() -> ApiException.badRequest("Kasb topilmadi"));
        Region region = regionRepository.findById(req.regionId())
                .orElseThrow(() -> ApiException.badRequest("Viloyat topilmadi"));
        District district = districtRepository.findById(req.districtId())
                .orElseThrow(() -> ApiException.badRequest("Tuman topilmadi"));

        EmployerProfile employer;
        if (currentUser != null) {
            employer = employerProfileRepository.findByUserId(currentUser.getId()).orElseGet(() -> {
                EmployerProfile ep = new EmployerProfile();
                ep.setUser(currentUser);
                ep.setFirstName(req.employerName() != null ? req.employerName() : "Ish beruvchi");
                ep.setRegion(region);
                ep.setDistrict(district);
                return employerProfileRepository.save(ep);
            });
        } else {
            // Find system or default employer
            employer = employerProfileRepository.findAll().stream().findFirst().orElseGet(() -> {
                User sysUser = new User("+998000000000", passwordEncoder.encode(UUID.randomUUID().toString()), Role.EMPLOYER);
                sysUser.setActive(true);
                sysUser.setVerified(true);
                sysUser = userRepository.saveAndFlush(sysUser);
                EmployerProfile ep = new EmployerProfile();
                ep.setUser(sysUser);
                ep.setFirstName("Telegram");
                ep.setLastName("Foydalanuvchisi");
                ep.setRegion(region);
                ep.setDistrict(district);
                return employerProfileRepository.save(ep);
            });
        }

        Job job = new Job();
        job.setEmployer(employer);
        job.setTitle(req.title().trim());
        job.setDescription(req.description() != null ? req.description().trim() : req.title().trim());
        job.setProfession(profession);
        job.setRegion(region);
        job.setDistrict(district);
        job.setPayment(req.payment() != null ? req.payment() : BigDecimal.ZERO);
        job.setPaymentType(PaymentType.FIXED);
        job.setJobType(JobType.DAILY);
        job.setStatus(JobStatus.ACTIVE);
        job.setUrgent(req.urgent());

        job = jobRepository.save(job);
        return toJobDto(job);
    }

    /**
     * Bootstrap config with professions, regions and stats.
     */
    @Transactional(readOnly = true)
    public TmaBootstrapResponse getBootstrap() {
        List<ProfessionResponse> professions = professionRepository.findByActiveTrueOrderByCategoryAscNameAsc()
                .stream().map(ProfessionResponse::from).toList();
        List<RegionResponse> regions = regionRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                .stream().map(RegionResponse::from).toList();

        long workersCount = workerProfileRepository.count();
        long jobsCount = jobRepository.count();

        return new TmaBootstrapResponse(
                professions,
                regions,
                workersCount,
                jobsCount,
                appSettingsService.getTelegramBotUsername(),
                "https://uzbishchi.uz/uploads/apk/ishchi.apk",
                "https://play.google.com/store/apps/details?id=uz.ecos.ishchi.app"
        );
    }

    @Transactional(readOnly = true)
    public TmaProfileDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));

        Optional<WorkerProfile> workerOpt = workerProfileRepository.findByUserId(userId);
        Optional<EmployerProfile> employerOpt = employerProfileRepository.findByUserId(userId);

        boolean hasWorker = workerOpt.isPresent();
        boolean hasEmployer = employerOpt.isPresent();

        // isRegistered = true if user has completed onboarding/registration
        boolean isRegistered = user.isRegistered();

        if (user.getRole() == Role.WORKER && hasWorker) {
            WorkerProfile wp = workerOpt.get();
            List<Long> professionIds = wp.getProfessions().stream().map(Profession::getId).toList();
            List<String> professionNames = wp.getProfessions().stream().map(Profession::getName).toList();
            return new TmaProfileDto(
                    user.getId(),
                    user.getPhone(),
                    user.getRole(),
                    user.getTelegramChatId(),
                    wp.getFirstName(),
                    wp.getLastName(),
                    wp.getFullName(),
                    wp.getAvatarUrl(),
                    wp.getAbout(),
                    wp.getRegion() != null ? wp.getRegion().getId() : null,
                    wp.getRegion() != null ? wp.getRegion().getName() : null,
                    wp.getDistrict() != null ? wp.getDistrict().getId() : null,
                    wp.getDistrict() != null ? wp.getDistrict().getName() : null,
                    professionIds,
                    professionNames,
                    wp.getExperienceYears(),
                    wp.isAvailable(),
                    wp.getRatingAverage(),
                    wp.getRatingCount(),
                    hasWorker,
                    hasEmployer,
                    isRegistered
            );
        } else if (hasEmployer) {
            EmployerProfile ep = employerOpt.get();
            return new TmaProfileDto(
                    user.getId(),
                    user.getPhone(),
                    user.getRole(),
                    user.getTelegramChatId(),
                    ep.getFirstName(),
                    ep.getLastName(),
                    ep.getFullName(),
                    null,
                    ep.getAbout(),
                    ep.getRegion() != null ? ep.getRegion().getId() : null,
                    ep.getRegion() != null ? ep.getRegion().getName() : null,
                    ep.getDistrict() != null ? ep.getDistrict().getId() : null,
                    ep.getDistrict() != null ? ep.getDistrict().getName() : null,
                    List.of(),
                    List.of(),
                    null,
                    null,
                    null,
                    0,
                    hasWorker,
                    hasEmployer,
                    isRegistered
            );
        } else {
            return new TmaProfileDto(
                    user.getId(),
                    user.getPhone(),
                    user.getRole(),
                    user.getTelegramChatId(),
                    "Foydalanuvchi",
                    "",
                    "Foydalanuvchi",
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    List.of(),
                    List.of(),
                    null,
                    null,
                    null,
                    0,
                    hasWorker,
                    hasEmployer,
                    false
            );
        }
    }

    private String normalizePhone(String raw) {
        if (raw == null) return null;
        String digits = raw.replaceAll("[^0-9]", "");
        String candidate = "+" + digits;
        return candidate.matches("^\\+998\\d{9}$") ? candidate : null;
    }

    /**
     * Sends a 4-digit OTP code directly to the user's Telegram chat via the bot.
     * Checks if the phone already belongs to an existing registered user.
     */
    @Transactional
    public TmaSendOtpResponse sendOtp(Long userId, TmaSendOtpRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));

        String phone = normalizePhone(req.phone());
        if (phone == null) {
            throw ApiException.badRequest("Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");
        }

        // Check if phone belongs to an existing registered user
        Optional<User> existingUserOpt = userRepository.findByPhone(phone);
        if (existingUserOpt.isPresent() && !existingUserOpt.get().getId().equals(user.getId())) {
            User existing = existingUserOpt.get();
            if (existing.isRegistered() && !existing.getPhone().startsWith("+998TG")) {
                return new TmaSendOtpResponse(true, "Ushbu raqam allaqachon ro'yxatdan o'tgan. Akkauntni ulash uchun parolingizni kiriting.");
            }
        }

        Long chatId = user.getTelegramChatId();
        if (chatId == null) {
            throw ApiException.badRequest("Telegram akkauntingiz aniqlanmadi");
        }

        String code = String.valueOf(1000 + RANDOM.nextInt(9000));
        OtpCode otp = new OtpCode(phone, code, OtpPurpose.REGISTER,
                Instant.now().plus(5, ChronoUnit.MINUTES));
        otpCodeRepository.save(otp);
        telegramService.sendOtp(chatId, code);

        return new TmaSendOtpResponse(false, "Tasdiqlash kodi Telegram botingizga yuborildi");
    }

    /**
     * Link an existing user account (from mobile app) to this Telegram account using password.
     */
    @Transactional
    public AuthResponse linkAccount(Long userId, TmaLinkAccountRequest req) {
        User placeholderUser = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));

        String phone = normalizePhone(req.phone());
        if (phone == null) {
            throw ApiException.badRequest("Telefon raqam formati noto'g'ri");
        }

        User existingUser = userRepository.findByPhone(phone)
                .orElseThrow(() -> ApiException.badRequest("Ushbu telefon raqamli foydalanuvchi topilmadi"));

        if (!passwordEncoder.matches(req.password(), existingUser.getPasswordHash())) {
            throw ApiException.badRequest("Parol noto'g'ri");
        }

        Long chatId = placeholderUser.getTelegramChatId();
        if (chatId != null) {
            if (!placeholderUser.getId().equals(existingUser.getId())) {
                placeholderUser.setTelegramChatId(null);
                userRepository.saveAndFlush(placeholderUser);
            }
            existingUser.setTelegramChatId(chatId);
        }
        existingUser.setVerified(true);
        existingUser.setRegistered(true);
        userRepository.save(existingUser);

        String newToken = jwtService.generateAccessToken(existingUser.getId(), existingUser.getPhone(), existingUser.getRole());
        return new AuthResponse(newToken, null, existingUser.getId(), existingUser.getRole());
    }

    /**
     * Complete onboarding / registration for a new TMA user with Phone, OTP code and Password.
     * Sets their real phone, encrypted password, role, name, region, profession, and marks as registered.
     */
    @Transactional
    public AuthResponse register(Long userId, TmaRegisterRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));

        String phone = normalizePhone(req.phone());
        if (phone == null) {
            throw ApiException.badRequest("Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak");
        }

        if (req.password() == null || req.password().trim().length() < 6) {
            throw ApiException.badRequest("Parol kamida 6 ta belgidan iborat bo'lishi kerak");
        }

        if (req.code() == null || req.code().trim().isBlank()) {
            throw ApiException.badRequest("Tasdiqlash kodi kiritilishi shart");
        }

        // Verify OTP code
        OtpCode otp = otpCodeRepository.findTopByPhoneAndPurposeAndUsedFalseOrderByCreatedAtDesc(phone, OtpPurpose.REGISTER)
                .orElseThrow(() -> ApiException.badRequest("Tasdiqlash kodi topilmadi, qaytadan kod so'rang"));
        if (otp.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("Tasdiqlash kodi muddati tugagan, qaytadan kod so'rang");
        }
        if (!otp.getCode().equals(req.code().trim())) {
            throw ApiException.badRequest("Tasdiqlash kodi noto'g'ri");
        }
        otp.setUsed(true);
        otpCodeRepository.save(otp);

        // Remove any other incomplete account with this phone
        userRepository.findByPhone(phone).ifPresent(other -> {
            if (!other.getId().equals(user.getId())) {
                userRepository.deleteUserById(other.getId());
            }
        });

        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(req.password().trim()));
        user.setVerified(true);
        user.setRegistered(true);

        // Determine target role
        Role target = req.role() != null ? req.role() : Role.EMPLOYER;
        user.setRole(target);

        if (target == Role.WORKER) {
            WorkerProfile wp = workerProfileRepository.findByUserId(userId).orElseGet(() -> {
                WorkerProfile fresh = new WorkerProfile();
                fresh.setUser(user);
                return fresh;
            });

            wp.setFirstName(req.firstName() != null && !req.firstName().isBlank() ? req.firstName() : "Usta");
            wp.setLastName(req.lastName() != null ? req.lastName() : "");
            if (req.about() != null) wp.setAbout(req.about());
            wp.setExperienceYears(req.experienceYears() != null ? req.experienceYears() : 1);
            wp.setAvailable(true);

            if (req.regionId() != null) {
                regionRepository.findById(req.regionId()).ifPresent(wp::setRegion);
            }
            if (wp.getRegion() == null) {
                regionRepository.findAll().stream().findFirst().ifPresent(wp::setRegion);
            }
            if (req.districtId() != null) {
                districtRepository.findById(req.districtId()).ifPresent(wp::setDistrict);
            }
            if (wp.getDistrict() == null && wp.getRegion() != null) {
                districtRepository.findByRegionIdOrderByNameAsc(wp.getRegion().getId())
                        .stream().findFirst().ifPresent(wp::setDistrict);
            }
            if (req.professionIds() != null && !req.professionIds().isEmpty()) {
                List<Profession> profs = professionRepository.findAllById(req.professionIds());
                wp.setProfessions(new HashSet<>(profs));
            }
            if (wp.getProfessions() == null || wp.getProfessions().isEmpty()) {
                professionRepository.findByActiveTrueOrderByCategoryAscNameAsc()
                        .stream().findFirst().ifPresent(p -> wp.setProfessions(new HashSet<>(Set.of(p))));
            }
            workerProfileRepository.save(wp);
        } else {
            EmployerProfile ep = employerProfileRepository.findByUserId(userId).orElseGet(() -> {
                EmployerProfile fresh = new EmployerProfile();
                fresh.setUser(user);
                return fresh;
            });
            ep.setFirstName(req.firstName() != null && !req.firstName().isBlank() ? req.firstName() : "Buyurtmachi");
            ep.setLastName(req.lastName() != null ? req.lastName() : "");
            if (req.about() != null) ep.setAbout(req.about());
            if (req.regionId() != null) {
                regionRepository.findById(req.regionId()).ifPresent(ep::setRegion);
            }
            if (ep.getRegion() == null) {
                regionRepository.findAll().stream().findFirst().ifPresent(ep::setRegion);
            }
            if (req.districtId() != null) {
                districtRepository.findById(req.districtId()).ifPresent(ep::setDistrict);
            }
            if (ep.getDistrict() == null && ep.getRegion() != null) {
                districtRepository.findByRegionIdOrderByNameAsc(ep.getRegion().getId())
                        .stream().findFirst().ifPresent(ep::setDistrict);
            }
            employerProfileRepository.save(ep);
        }

        walletService.createForUser(user);
        userRepository.save(user);

        String newToken = jwtService.generateAccessToken(user.getId(), user.getPhone(), user.getRole());
        return new AuthResponse(newToken, null, user.getId(), user.getRole());
    }

    @Transactional
    public AuthResponse switchRole(Long userId, TmaSwitchRoleRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));

        Role target = req.targetRole() != null ? req.targetRole() : (user.getRole() == Role.WORKER ? Role.EMPLOYER : Role.WORKER);

        if (target == Role.WORKER) {
            WorkerProfile wp = workerProfileRepository.findByUserId(userId).orElseGet(() -> {
                WorkerProfile fresh = new WorkerProfile();
                fresh.setUser(user);
                return fresh;
            });

            if (req.firstName() != null && !req.firstName().isBlank()) {
                wp.setFirstName(req.firstName());
            } else if (wp.getFirstName() == null || wp.getFirstName().isBlank()) {
                wp.setFirstName("Usta");
            }

            if (req.lastName() != null) {
                wp.setLastName(req.lastName());
            } else if (wp.getLastName() == null) {
                wp.setLastName("");
            }

            if (req.about() != null) {
                wp.setAbout(req.about());
            }

            if (req.experienceYears() != null) {
                wp.setExperienceYears(req.experienceYears());
            } else if (wp.getExperienceYears() == null) {
                wp.setExperienceYears(1);
            }

            if (req.available() != null) {
                wp.setAvailable(req.available());
            }

            if (req.regionId() != null) {
                Region region = regionRepository.findById(req.regionId()).orElse(null);
                if (region != null) wp.setRegion(region);
            }
            if (wp.getRegion() == null) {
                Region defaultRegion = regionRepository.findAll().stream().findFirst().orElse(null);
                wp.setRegion(defaultRegion);
            }

            if (req.districtId() != null) {
                District district = districtRepository.findById(req.districtId()).orElse(null);
                if (district != null) wp.setDistrict(district);
            }
            if (wp.getDistrict() == null && wp.getRegion() != null) {
                District defaultDistrict = districtRepository.findByRegionIdOrderByNameAsc(wp.getRegion().getId()).stream().findFirst().orElse(null);
                wp.setDistrict(defaultDistrict);
            }

            if (req.professionIds() != null && !req.professionIds().isEmpty()) {
                List<Profession> profs = professionRepository.findAllById(req.professionIds());
                wp.setProfessions(new HashSet<>(profs));
            } else if (wp.getProfessions().isEmpty()) {
                Profession defaultProf = professionRepository.findByActiveTrueOrderByCategoryAscNameAsc().stream().findFirst().orElse(null);
                if (defaultProf != null) {
                    wp.setProfessions(new HashSet<>(Set.of(defaultProf)));
                }
            }

            workerProfileRepository.save(wp);
            user.setRole(Role.WORKER);
        } else {
            EmployerProfile ep = employerProfileRepository.findByUserId(userId).orElseGet(() -> {
                EmployerProfile fresh = new EmployerProfile();
                fresh.setUser(user);
                return fresh;
            });

            if (req.firstName() != null && !req.firstName().isBlank()) {
                ep.setFirstName(req.firstName());
            } else if (ep.getFirstName() == null || ep.getFirstName().isBlank()) {
                ep.setFirstName("Buyurtmachi");
            }
            if (req.lastName() != null) {
                ep.setLastName(req.lastName());
            } else if (ep.getLastName() == null) {
                ep.setLastName("");
            }
            if (req.about() != null) {
                ep.setAbout(req.about());
            }

            if (req.regionId() != null) {
                Region region = regionRepository.findById(req.regionId()).orElse(null);
                if (region != null) ep.setRegion(region);
            }
            if (ep.getRegion() == null) {
                Region defaultRegion = regionRepository.findAll().stream().findFirst().orElse(null);
                ep.setRegion(defaultRegion);
            }

            if (req.districtId() != null) {
                District district = districtRepository.findById(req.districtId()).orElse(null);
                if (district != null) ep.setDistrict(district);
            }
            if (ep.getDistrict() == null && ep.getRegion() != null) {
                District defaultDistrict = districtRepository.findByRegionIdOrderByNameAsc(ep.getRegion().getId()).stream().findFirst().orElse(null);
                ep.setDistrict(defaultDistrict);
            }

            employerProfileRepository.save(ep);
            user.setRole(Role.EMPLOYER);
        }

        user.setRegistered(true);
        userRepository.save(user);

        String newToken = jwtService.generateAccessToken(user.getId(), user.getPhone(), user.getRole());
        return new AuthResponse(newToken, null, user.getId(), user.getRole());
    }

    @Transactional
    public boolean toggleAvailability(Long userId) {
        WorkerProfile wp = workerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> ApiException.badRequest("Usta profili topilmadi"));
        wp.setAvailable(!wp.isAvailable());
        workerProfileRepository.save(wp);
        return wp.isAvailable();
    }
}
