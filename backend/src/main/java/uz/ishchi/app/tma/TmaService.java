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
import uz.ishchi.app.auth.dto.AuthResponse;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.JobType;
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
import uz.ishchi.app.tma.dto.*;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;
import uz.ishchi.app.worker.WorkerSpecifications;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

@Service
@RequiredArgsConstructor
public class TmaService {

    private static final Logger log = LoggerFactory.getLogger(TmaService.class);

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
}
