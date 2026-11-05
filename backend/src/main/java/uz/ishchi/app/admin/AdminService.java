package uz.ishchi.app.admin;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import uz.ishchi.app.admin.dto.AdminJobResponse;
import uz.ishchi.app.admin.dto.AdminUserResponse;
import uz.ishchi.app.admin.dto.StatsResponse;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.auth.OtpCodeRepository;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.job.JobImageRepository;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.profile.ProfileService;
import uz.ishchi.app.profile.dto.ProfileResponse;
import uz.ishchi.app.telegram.TelegramAwaitingFeedbackRepository;
import uz.ishchi.app.telegram.TelegramFeedbackRepository;
import uz.ishchi.app.telegram.TelegramJobDraftRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;
import uz.ishchi.app.wallet.WalletAccountRepository;

import jakarta.persistence.criteria.JoinType;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ProfileService profileService;
    private final TelegramFeedbackRepository telegramFeedbackRepository;
    private final WalletAccountRepository walletAccountRepository;
    private final JobImageRepository jobImageRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final TelegramAwaitingFeedbackRepository telegramAwaitingFeedbackRepository;
    private final TelegramJobDraftRepository telegramJobDraftRepository;
    private final FileStorageService fileStorageService;

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(Role role, Boolean active, Boolean verified, String search, Pageable pageable) {
        Page<User> page = userRepository.search(role, active, verified, search, pageable);
        return page.map(this::toAdminUserResponse);
    }

    /** Table-row summary (name + region) is looked up per user — page size is capped at 20,
     *  so this stays a handful of cheap indexed lookups rather than a real N+1 concern. */
    private AdminUserResponse toAdminUserResponse(User user) {
        String fullName = null;
        String regionName = null;
        if (user.getRole() == Role.WORKER) {
            var p = workerProfileRepository.findByUserId(user.getId()).orElse(null);
            if (p != null) {
                fullName = p.getFirstName() + " " + p.getLastName();
                regionName = p.getRegion().getName();
            }
        } else if (user.getRole() == Role.EMPLOYER) {
            var p = employerProfileRepository.findByUserId(user.getId()).orElse(null);
            if (p != null) {
                fullName = p.getFirstName() + " " + p.getLastName();
                regionName = p.getRegion().getName();
            }
        }
        return AdminUserResponse.from(user, fullName, regionName);
    }

    @Transactional(readOnly = true)
    public ProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
        return profileService.getProfile(user);
    }

    @Transactional
    public AdminUserResponse setUserActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
        user.setActive(active);
        return toAdminUserResponse(user);
    }

    /**
     * Permanently removes a worker or employer account together with everything it owns:
     * both profiles, the jobs it posted (with their images and unlock records), its wallet and
     * transaction history, refresh and device tokens. The database's ON DELETE CASCADE rules do
     * the heavy lifting; Telegram feedback the user wrote is kept with its author cleared.
     *
     * Administrator accounts can never be deleted this way, which also rules out an admin
     * deleting themselves or locking everyone out of the panel.
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Foydalanuvchi topilmadi"));
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("Administrator akkauntini o'chirib bo'lmaydi");
        }

        String phone = user.getPhone();
        Long chatId = user.getTelegramChatId();
        Role role = user.getRole();

        // Everything below has to be read BEFORE the delete: afterwards the cascade has already
        // removed the rows these lookups come from. Scalar queries only, so no profile or wallet
        // entities end up in the session pointing at a user row that is about to disappear.
        List<String> files = new ArrayList<>(jobImageRepository.findUrlsByEmployerUserId(userId));
        workerProfileRepository.findAvatarUrlByUserId(userId).ifPresent(files::add);
        employerProfileRepository.findAvatarUrlByUserId(userId).ifPresent(files::add);
        var balance = walletAccountRepository.findBalanceByUserId(userId).orElse(null);

        try {
            userRepository.deleteUserById(userId);
        } catch (DataIntegrityViolationException e) {
            log.error("Could not delete user id={}: a table still references it", userId, e);
            throw ApiException.conflict("Foydalanuvchini o'chirib bo'lmadi: unga bog'liq ma'lumotlar mavjud");
        }

        otpCodeRepository.deleteByPhone(phone);
        if (chatId != null) {
            // Half-finished bot conversations are keyed by chat id, not by user, so the
            // cascade does not reach them.
            if (telegramAwaitingFeedbackRepository.existsById(chatId)) {
                telegramAwaitingFeedbackRepository.deleteById(chatId);
            }
            if (telegramJobDraftRepository.existsById(chatId)) {
                telegramJobDraftRepository.deleteById(chatId);
            }
        }

        log.warn("Admin deleted user id={} phone={} role={} walletBalance={} files={}",
                userId, phone, role, balance, files.size());

        // Uploads are public URLs, so a deleted person's photo must not outlive the account.
        // Removed only after the transaction commits: if it rolls back, the account still
        // exists and must keep its pictures.
        if (!files.isEmpty()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    files.forEach(fileStorageService::removeQuietly);
                }
            });
        }
    }

    @Transactional(readOnly = true)
    public Page<AdminJobResponse> listJobs(JobStatus status, String search, Pageable pageable) {
        Specification<Job> spec = Specification.where(null);
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (search != null && !search.isBlank()) {
            String like = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> {
                var employer = root.join("employer", JoinType.LEFT);
                var employerUser = employer.join("user", JoinType.LEFT);
                return cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(cb.concat(cb.concat(employer.get("firstName"), " "), employer.get("lastName"))), like),
                        cb.like(cb.lower(employerUser.get("phone")), like)
                );
            });
        }
        Page<Job> page = jobRepository.findAll(spec, pageable);
        return page.map(AdminJobResponse::from);
    }

    @Transactional
    public AdminJobResponse setJobBlocked(Long jobId, boolean blocked) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        job.setBlocked(blocked);
        return AdminJobResponse.from(job);
    }

    @Transactional
    public void deleteJob(Long jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw ApiException.notFound("Buyurtma topilmadi");
        }
        jobRepository.deleteById(jobId);
    }

    @Transactional(readOnly = true)
    public StatsResponse stats() {
        Instant startOfToday = LocalDate.now(ZONE).atStartOfDay(ZONE).toInstant();
        Map<String, Long> jobsByStatus = new LinkedHashMap<>();
        for (JobStatus status : JobStatus.values()) {
            jobsByStatus.put(status.name(), jobRepository.countByStatus(status));
        }
        return new StatsResponse(
                userRepository.count(),
                userRepository.countByRole(Role.WORKER),
                userRepository.countByRole(Role.EMPLOYER),
                jobRepository.countByStatusAndBlockedFalse(JobStatus.ACTIVE),
                userRepository.countByCreatedAtAfter(startOfToday),
                jobRepository.countByCreatedAtAfter(startOfToday),
                userRepository.countByActiveFalse(),
                userRepository.countByTelegramChatIdIsNotNull(),
                telegramFeedbackRepository.countByResolvedFalse(),
                walletAccountRepository.sumAllBalances(),
                jobsByStatus
        );
    }
}
