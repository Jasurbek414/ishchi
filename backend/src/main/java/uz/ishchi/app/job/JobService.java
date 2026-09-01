package uz.ishchi.app.job;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.TransactionType;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.DistrictRepository;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;
import uz.ishchi.app.profession.Profession;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.profile.EmployerProfile;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.job.dto.JobCreateRequest;
import uz.ishchi.app.job.dto.JobImageResponse;
import uz.ishchi.app.job.dto.JobResponse;
import uz.ishchi.app.job.dto.JobUpdateRequest;
import uz.ishchi.app.notification.DeviceTokenRepository;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.settings.AppSettings;
import uz.ishchi.app.settings.AppSettingsService;
import uz.ishchi.app.user.User;
import uz.ishchi.app.wallet.WalletService;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobImageRepository jobImageRepository;
    private final JobUnlockRepository jobUnlockRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ProfessionRepository professionRepository;
    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;
    private final FileStorageService fileStorageService;
    private final DeviceTokenRepository deviceTokenRepository;
    private final NotificationService notificationService;
    private final AppSettingsService appSettingsService;
    private final WalletService walletService;

    @Transactional(readOnly = true)
    public Page<JobResponse> search(User currentUser, Long regionId, Long districtId, Long professionId, JobType jobType,
                                     BigDecimal minPayment, BigDecimal maxPayment, JobStatus status,
                                     String keyword, String sort, Long nearRegionId, Long nearDistrictId,
                                     Pageable pageable) {
        Specification<Job> spec = Specification.where(JobSpecifications.notBlocked())
                .and(JobSpecifications.regionId(regionId))
                .and(JobSpecifications.districtId(districtId))
                .and(JobSpecifications.professionId(professionId))
                .and(JobSpecifications.jobType(jobType))
                .and(JobSpecifications.minPayment(minPayment))
                .and(JobSpecifications.maxPayment(maxPayment))
                .and(JobSpecifications.status(status != null ? status : JobStatus.ACTIVE))
                .and(JobSpecifications.search(keyword));

        Pageable effectivePageable = pageable;
        if ("nearest".equalsIgnoreCase(sort) && (nearRegionId != null || nearDistrictId != null)) {
            spec = spec.and(JobSortSpecifications.nearestFirst(nearRegionId, nearDistrictId));
            effectivePageable = Pageable.ofSize(pageable.getPageSize()).withPage(pageable.getPageNumber());
        } else if ("highest_pay".equalsIgnoreCase(sort)) {
            effectivePageable = withSort(pageable, Sort.by(Sort.Direction.DESC, "payment"));
        } else {
            effectivePageable = withSort(pageable, Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        Page<Job> page = jobRepository.findAll(spec, effectivePageable);
        return mapWithUnlockState(page, currentUser);
    }

    @Transactional(readOnly = true)
    public List<JobResponse> mapSearch(User currentUser, Long regionId, Long professionId) {
        Specification<Job> spec = Specification.where(JobSpecifications.notBlocked())
                .and(JobSpecifications.status(JobStatus.ACTIVE))
                .and(JobSpecifications.hasCoordinates())
                .and(JobSpecifications.regionId(regionId))
                .and(JobSpecifications.professionId(professionId));
        Pageable limit = org.springframework.data.domain.PageRequest.of(0, 500,
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Job> page = jobRepository.findAll(spec, limit);
        return mapWithUnlockState(page, currentUser).getContent();
    }

    /**
     * Applies the job-view-fee paywall across a page of results: for a WORKER caller, when
     * the fee is configured and active, jobs they haven't already paid to unlock come back
     * with the employer's phone number withheld (everything else stays visible, so browsing
     * stays free) — checked in one batch query per page rather than per job.
     */
    private Page<JobResponse> mapWithUnlockState(Page<Job> page, User currentUser) {
        if (!isJobViewFeeActive(currentUser)) {
            return page.map(JobResponse::from);
        }
        List<Long> jobIds = page.getContent().stream().map(Job::getId).toList();
        Set<Long> unlockedIds = jobIds.isEmpty()
                ? Set.of()
                : jobUnlockRepository.findUnlockedJobIds(currentUser.getId(), jobIds);
        return page.map(job -> JobResponse.from(job, unlockedIds.contains(job.getId())));
    }

    private boolean isJobViewFeeActive(User currentUser) {
        if (currentUser.getRole() != Role.WORKER) return false;
        AppSettings settings = appSettingsService.getRaw();
        return settings.isWalletEnabled() && settings.isJobViewFeeEnabled()
                && settings.getJobViewFee().compareTo(BigDecimal.ZERO) > 0;
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> myJobs(User employerUser, JobStatus status, Pageable pageable) {
        EmployerProfile employer = employerProfileRepository.findByUserId(employerUser.getId())
                .orElseThrow(() -> ApiException.notFound("Ish beruvchi profili topilmadi"));
        Specification<Job> spec = Specification.where(JobSpecifications.employerId(employer.getId()))
                .and(JobSpecifications.status(status));
        Pageable effective = withSort(pageable, Sort.by(Sort.Direction.DESC, "createdAt"));
        return jobRepository.findAll(spec, effective).map(JobResponse::from);
    }

    @Transactional(readOnly = true)
    public JobResponse getById(User currentUser, Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (job.isBlocked()) {
            throw ApiException.notFound("Buyurtma topilmadi");
        }
        boolean unlocked = !isJobViewFeeActive(currentUser)
                || jobUnlockRepository.existsByJobIdAndWorkerId(job.getId(), currentUser.getId());
        return JobResponse.from(job, unlocked);
    }

    /**
     * Worker-only action: pays the configured job-view fee (once) to reveal the employer's
     * phone number for this job. No-ops (and never charges) if the fee isn't active or this
     * worker already unlocked it earlier.
     */
    @Transactional
    public JobResponse unlock(User workerUser, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (job.isBlocked()) {
            throw ApiException.notFound("Buyurtma topilmadi");
        }
        if (!isJobViewFeeActive(workerUser)
                || jobUnlockRepository.existsByJobIdAndWorkerId(job.getId(), workerUser.getId())) {
            return JobResponse.from(job, true);
        }
        AppSettings settings = appSettingsService.getRaw();
        walletService.charge(workerUser, settings.getJobViewFee(), TransactionType.JOB_VIEW_FEE,
                "Buyurtma ma'lumotlarini ochish: " + job.getTitle());
        jobUnlockRepository.save(new JobUnlock(job, workerUser));
        return JobResponse.from(job, true);
    }

    @Transactional
    public JobResponse create(User employerUser, JobCreateRequest request) {
        EmployerProfile employer = employerProfileRepository.findByUserId(employerUser.getId())
                .orElseThrow(() -> ApiException.notFound("Ish beruvchi profili topilmadi"));

        AppSettings settings = appSettingsService.getRaw();
        if (settings.isWalletEnabled() && settings.isJobPostingFeeEnabled()
                && settings.getJobPostingFee().compareTo(BigDecimal.ZERO) > 0) {
            walletService.charge(employerUser, settings.getJobPostingFee(), TransactionType.JOB_POSTING_FEE,
                    "Buyurtma joylashtirish: " + request.title());
        }

        Job job = new Job();
        job.setEmployer(employer);
        applyRequest(job, request.title(), request.description(), request.professionId(),
                request.regionId(), request.districtId(), request.payment(), request.paymentType(),
                request.jobType(), request.workersNeeded(), request.startDate(),
                request.durationValue(), request.durationUnit(), request.latitude(), request.longitude());
        job.setStatus(JobStatus.ACTIVE);
        recomputeExpiry(job);
        jobRepository.save(job);
        notifyMatchingWorkers(job);
        return JobResponse.from(job);
    }

    private void notifyMatchingWorkers(Job job) {
        List<String> tokens = deviceTokenRepository.findTokensForMatchingWorkers(
                job.getProfession().getId(), job.getRegion().getId());
        notificationService.send(tokens, "Yangi mos buyurtma",
                job.getTitle() + " — " + job.getRegion().getName(),
                Map.of("type", "job", "jobId", String.valueOf(job.getId())));
    }

    @Transactional
    public JobResponse update(User employerUser, Long jobId, JobUpdateRequest request) {
        Job job = getOwnedJob(employerUser, jobId);
        applyRequest(job,
                request.title() != null ? request.title() : job.getTitle(),
                request.description() != null ? request.description() : job.getDescription(),
                request.professionId() != null ? request.professionId() : job.getProfession().getId(),
                request.regionId() != null ? request.regionId() : job.getRegion().getId(),
                request.districtId() != null ? request.districtId() : job.getDistrict().getId(),
                request.payment() != null ? request.payment() : job.getPayment(),
                request.paymentType() != null ? request.paymentType() : job.getPaymentType(),
                request.jobType() != null ? request.jobType() : job.getJobType(),
                request.workersNeeded() != null ? request.workersNeeded() : job.getWorkersNeeded(),
                request.startDate() != null ? request.startDate() : job.getStartDate(),
                request.durationValue() != null ? request.durationValue() : job.getDurationValue(),
                request.durationUnit() != null ? request.durationUnit() : job.getDurationUnit(),
                request.latitude() != null ? request.latitude() : job.getLatitude(),
                request.longitude() != null ? request.longitude() : job.getLongitude());
        recomputeExpiry(job);
        return JobResponse.from(job);
    }

    @Transactional
    public JobResponse changeStatus(User employerUser, Long jobId, JobStatus newStatus) {
        Job job = getOwnedJob(employerUser, jobId);
        if (newStatus == JobStatus.EXPIRED) {
            throw ApiException.badRequest("EXPIRED holatini tizim o'zi belgilaydi");
        }
        job.setStatus(newStatus);
        if (newStatus == JobStatus.ACTIVE) {
            recomputeExpiry(job);
        }
        return JobResponse.from(job);
    }

    @Transactional
    public void delete(User employerUser, Long jobId) {
        Job job = getOwnedJob(employerUser, jobId);
        jobRepository.delete(job);
    }

    @Transactional
    public List<JobImageResponse> addImages(User employerUser, Long jobId, List<MultipartFile> files) {
        Job job = getOwnedJob(employerUser, jobId);
        for (MultipartFile file : files) {
            String url = fileStorageService.storeJobImage(file);
            jobImageRepository.save(new JobImage(job, url));
        }
        return jobImageRepository.findByJobIdOrderByCreatedAtAsc(job.getId()).stream()
                .map(JobImageResponse::from).toList();
    }

    @Transactional
    public void removeImage(User employerUser, Long jobId, Long imageId) {
        Job job = getOwnedJob(employerUser, jobId);
        JobImage image = jobImageRepository.findByIdAndJobId(imageId, job.getId())
                .orElseThrow(() -> ApiException.notFound("Rasm topilmadi"));
        jobImageRepository.delete(image);
    }

    private Job getOwnedJob(User employerUser, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (!job.getEmployer().getUser().getId().equals(employerUser.getId())) {
            throw ApiException.forbidden("Bu buyurtma sizga tegishli emas");
        }
        return job;
    }

    private void applyRequest(Job job, String title, String description, Long professionId, Long regionId,
                               Long districtId, BigDecimal payment, uz.ishchi.app.common.PaymentType paymentType,
                               JobType jobType, Integer workersNeeded, java.time.LocalDate startDate,
                               Integer durationValue, uz.ishchi.app.common.DurationUnit durationUnit,
                               Double latitude, Double longitude) {
        Profession profession = professionRepository.findById(professionId)
                .orElseThrow(() -> ApiException.badRequest("Kasb topilmadi"));
        Region region = regionRepository.findById(regionId)
                .orElseThrow(() -> ApiException.badRequest("Viloyat topilmadi"));
        District district = districtRepository.findById(districtId)
                .orElseThrow(() -> ApiException.badRequest("Tuman/shahar topilmadi"));
        if (!district.getRegion().getId().equals(region.getId())) {
            throw ApiException.badRequest("Tanlangan tuman ushbu viloyatga tegishli emas");
        }

        job.setTitle(title);
        job.setDescription(description);
        job.setProfession(profession);
        job.setRegion(region);
        job.setDistrict(district);
        job.setPayment(payment);
        job.setPaymentType(paymentType);
        job.setJobType(jobType);
        job.setWorkersNeeded(workersNeeded != null ? workersNeeded : 1);
        job.setStartDate(startDate);
        job.setDurationValue(durationValue);
        job.setDurationUnit(durationUnit);
        job.setLatitude(latitude);
        job.setLongitude(longitude);
    }

    private static final java.time.ZoneId ASIA_TASHKENT = java.time.ZoneId.of("Asia/Tashkent");

    private void recomputeExpiry(Job job) {
        if (job.getStartDate() == null || job.getDurationValue() == null || job.getDurationUnit() == null) {
            job.setExpiresAt(null);
            return;
        }
        java.time.LocalDate endDate = switch (job.getDurationUnit()) {
            case DAY -> job.getStartDate().plusDays(job.getDurationValue());
            case WEEK -> job.getStartDate().plusWeeks(job.getDurationValue());
            case MONTH -> job.getStartDate().plusMonths(job.getDurationValue());
        };
        job.setExpiresAt(endDate.atStartOfDay(ASIA_TASHKENT).toInstant());
    }

    private Pageable withSort(Pageable pageable, Sort sort) {
        if (pageable.getSort().isSorted()) {
            return pageable;
        }
        return org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }
}
