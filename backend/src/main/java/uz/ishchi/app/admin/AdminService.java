package uz.ishchi.app.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.admin.dto.AdminJobResponse;
import uz.ishchi.app.admin.dto.AdminUserResponse;
import uz.ishchi.app.admin.dto.StatsResponse;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.job.JobImageRepository;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.profile.ProfileService;
import uz.ishchi.app.profile.dto.ProfileResponse;
import uz.ishchi.app.telegram.TelegramFeedbackRepository;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;
import uz.ishchi.app.wallet.WalletAccountRepository;

import jakarta.persistence.criteria.JoinType;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final FileStorageService fileStorageService;

    private static final ZoneId ZONE = ZoneId.of("Asia/Tashkent");

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> listUsers(Role role, Boolean active, Boolean verified, String search, Pageable pageable) {
        Page<User> page = userRepository.search(role, active, verified, search, pageable);
        Map<Long, RowSummary> summaries = summariesFor(page.getContent());
        return page.map(user -> {
            RowSummary summary = summaries.get(user.getId());
            return AdminUserResponse.from(user,
                    summary == null ? null : summary.fullName(),
                    summary == null ? null : summary.regionName());
        });
    }

    private record RowSummary(String fullName, String regionName) {
    }

    /**
     * Resolves the name and region shown in each table row for the whole page in two queries. This
     * used to run a profile lookup per row, which was defended as "page size is capped at 20" —
     * the cap is a request parameter, so it was never a guarantee.
     */
    private Map<Long, RowSummary> summariesFor(List<User> users) {
        Map<Role, List<Long>> idsByRole = users.stream()
                .filter(u -> u.getRole() == Role.WORKER || u.getRole() == Role.EMPLOYER)
                .collect(Collectors.groupingBy(User::getRole, Collectors.mapping(User::getId, Collectors.toList())));

        Map<Long, RowSummary> summaries = new HashMap<>();
        List<Long> workerIds = idsByRole.getOrDefault(Role.WORKER, List.of());
        if (!workerIds.isEmpty()) {
            workerProfileRepository.findByUserIdIn(workerIds).forEach(p -> summaries.put(p.getUser().getId(),
                    new RowSummary(p.getFirstName() + " " + p.getLastName(), p.getRegion().getName())));
        }
        List<Long> employerIds = idsByRole.getOrDefault(Role.EMPLOYER, List.of());
        if (!employerIds.isEmpty()) {
            employerProfileRepository.findByUserIdIn(employerIds).forEach(p -> summaries.put(p.getUser().getId(),
                    new RowSummary(p.getFirstName() + " " + p.getLastName(), p.getRegion().getName())));
        }
        return summaries;
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        RowSummary summary = summariesFor(List.of(user)).get(user.getId());
        return AdminUserResponse.from(user,
                summary == null ? null : summary.fullName(),
                summary == null ? null : summary.regionName());
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
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        // The employer's own delete path cleans the image files up; this one did not, so a job
        // removed by an admin left its uploads behind.
        jobImageRepository.findByJobIdOrderByCreatedAtAsc(job.getId())
                .forEach(image -> fileStorageService.deleteAfterCommit(image.getUrl()));
        jobRepository.delete(job);
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
