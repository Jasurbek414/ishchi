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
import uz.ishchi.app.common.ApplicationStatus;
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
import uz.ishchi.app.common.PaymentType;
import uz.ishchi.app.job.dto.JobResponse;
import uz.ishchi.app.job.dto.PriceGuidanceResponse;
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
    private final JobApplicationService applicationService;
    private final JobApplicationRepository applicationRepository;
    private final uz.ishchi.app.search.SavedSearchService savedSearchService;

    @Transactional(readOnly = true)
    public Page<JobResponse> search(User currentUser, Long regionId, Long districtId, Long professionId, JobType jobType,
                                     BigDecimal minPayment, BigDecimal maxPayment, JobStatus status,
                                     String keyword, String sort, Long nearRegionId, Long nearDistrictId,
                                     Boolean urgent, Pageable pageable) {
        Specification<Job> spec = Specification.where(JobSpecifications.notBlocked())
                .and(JobSpecifications.regionId(regionId))
                .and(JobSpecifications.districtId(districtId))
                .and(JobSpecifications.professionId(professionId))
                .and(JobSpecifications.jobType(jobType))
                .and(JobSpecifications.minPayment(minPayment))
                .and(JobSpecifications.maxPayment(maxPayment))
                .and(JobSpecifications.status(status != null ? status : JobStatus.ACTIVE))
                .and(JobSpecifications.search(keyword))
                .and(JobSpecifications.urgent(urgent));

        Pageable effectivePageable = pageable;
        if ("nearest".equalsIgnoreCase(sort) && (nearRegionId != null || nearDistrictId != null)) {
            spec = spec.and(JobSortSpecifications.nearestFirst(nearRegionId, nearDistrictId));
            effectivePageable = Pageable.ofSize(pageable.getPageSize()).withPage(pageable.getPageNumber());
        } else if ("highest_pay".equalsIgnoreCase(sort)) {
            effectivePageable = withSort(pageable, Sort.by(Sort.Direction.DESC, "payment"));
        } else {
            // Urgent first, then newest: a same-day job losing its place to something posted an hour
            // later is exactly the outcome the flag exists to prevent.
            effectivePageable = withSort(pageable,
                    Sort.by(Sort.Order.desc("urgent"), Sort.Order.desc("createdAt")));
        }

        Page<Job> page = jobRepository.findAll(spec, effectivePageable);
        return mapWithUnlockState(page, currentUser);
    }

    @Transactional(readOnly = true)
    public List<JobResponse> mapSearch(User currentUser, Long regionId, Long professionId,
                                        Double latitude, Double longitude, Double radiusDegrees,
                                        Long employerId, Boolean urgent) {
        Specification<Job> spec = Specification.where(JobSpecifications.notBlocked())
                .and(JobSpecifications.status(JobStatus.ACTIVE))
                .and(JobSpecifications.hasCoordinates())
                .and(JobSpecifications.regionId(regionId))
                .and(JobSpecifications.professionId(professionId))
                .and(JobSpecifications.employerId(employerId))
                .and(JobSpecifications.urgent(urgent))
                // Without this the map answered with the newest 500 jobs whatever was on screen, so
                // panning somewhere else showed the same pins.
                .and(JobSpecifications.withinBox(latitude, longitude, radiusDegrees));
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
        List<Long> jobIds = page.getContent().stream().map(Job::getId).toList();

        // Two batch queries for the whole page: how many workers responded to each job, and — for a
        // worker — whether they responded themselves, so the list can say "javob berilgan".
        Map<Long, Long> applicationCounts = applicationService.countsFor(jobIds);
        Map<Long, ApplicationStatus> myStatuses = currentUser.getRole() == Role.WORKER
                ? applicationService.statusesFor(currentUser.getId(), jobIds)
                : Map.of();

        if (!isJobViewFeeActive(currentUser)) {
            return page.map(job -> JobResponse.from(job)
                    .withApplications(applicationCounts.get(job.getId()), myStatuses.get(job.getId())));
        }
        Set<Long> unlockedIds = jobIds.isEmpty()
                ? Set.of()
                : jobUnlockRepository.findUnlockedJobIds(currentUser.getId(), jobIds);
        return page.map(job -> JobResponse.from(job, unlockedIds.contains(job.getId()))
                .withApplications(applicationCounts.get(job.getId()), myStatuses.get(job.getId())));
    }

    private boolean isJobViewFeeActive(User currentUser) {
        if (currentUser.getRole() != Role.WORKER) return false;
        AppSettings settings = appSettingsService.getRaw();
        return settings.isWalletEnabled() && settings.isJobViewFeeEnabled()
                && settings.getJobViewFee().compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * What comparable postings pay. Returns an empty answer rather than a misleading one when there
     * is not enough history to say anything — a median drawn from two postings is noise.
     */
    @Transactional(readOnly = true)
    public PriceGuidanceResponse priceGuidance(Long professionId, Long regionId, PaymentType paymentType) {
        Object[] raw = jobRepository.paymentPercentiles(professionId, regionId, paymentType.name());
        Object[] row = raw.length == 1 && raw[0] instanceof Object[] inner ? inner : raw;
        long sampleSize = row[0] == null ? 0 : ((Number) row[0]).longValue();
        if (sampleSize < MIN_PRICE_GUIDANCE_SAMPLE) {
            return PriceGuidanceResponse.empty(professionId, regionId);
        }
        return new PriceGuidanceResponse(professionId, regionId, sampleSize,
                money(row[1]), money(row[2]), money(row[3]), money(row[4]), money(row[5]));
    }

    private static BigDecimal money(Object value) {
        if (value == null) return null;
        return BigDecimal.valueOf(((Number) value).doubleValue()).setScale(0, java.math.RoundingMode.HALF_UP);
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

        ApplicationStatus myStatus = currentUser.getRole() == Role.WORKER
                ? applicationService.statusesFor(currentUser.getId(), List.of(job.getId())).get(job.getId())
                : null;
        EmployerProfile employer = job.getEmployer();
        return JobResponse.from(job, unlocked)
                .withApplications(applicationRepository.countByJobId(job.getId()), myStatus)
                // Only on the single-job view: a worker deciding whether a posting is worth a call
                // had nothing at all to go on before this.
                .withEmployerStats(
                        jobRepository.countByEmployerId(employer.getId()),
                        jobRepository.countByEmployerIdAndStatus(employer.getId(), JobStatus.COMPLETED),
                        employer.getRatingAverage(),
                        employer.getRatingCount());
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
        job.setUrgent(Boolean.TRUE.equals(request.urgent()));
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
        // Separate from the profession/region sweep above: a saved search is what the worker asked
        // for explicitly, so it is worth telling them about even where the broad match would not.
        savedSearchService.notifyMatching(job);
    }

    /**
     * Posts the same job again as a fresh ACTIVE listing. Charges the posting fee like any new job —
     * it is a new job — and deliberately does not carry over images or responses, which belong to
     * the round that already happened.
     */
    @Transactional
    public JobResponse repost(User employerUser, Long jobId) {
        Job source = getOwnedJobIgnoringBlock(employerUser, jobId);
        EmployerProfile employer = source.getEmployer();

        AppSettings settings = appSettingsService.getRaw();
        if (settings.isWalletEnabled() && settings.isJobPostingFeeEnabled()
                && settings.getJobPostingFee().compareTo(BigDecimal.ZERO) > 0) {
            walletService.charge(employerUser, settings.getJobPostingFee(), TransactionType.JOB_POSTING_FEE,
                    "Buyurtmani qayta joylashtirish: " + source.getTitle());
        }

        Job copy = new Job();
        copy.setEmployer(employer);
        copy.setTitle(source.getTitle());
        copy.setDescription(source.getDescription());
        copy.setProfession(source.getProfession());
        copy.setRegion(source.getRegion());
        copy.setDistrict(source.getDistrict());
        copy.setPayment(source.getPayment());
        copy.setPaymentType(source.getPaymentType());
        copy.setJobType(source.getJobType());
        copy.setWorkersNeeded(source.getWorkersNeeded());
        copy.setDurationValue(source.getDurationValue());
        copy.setDurationUnit(source.getDurationUnit());
        copy.setLatitude(source.getLatitude());
        copy.setLongitude(source.getLongitude());
        copy.setUrgent(source.isUrgent());
        // Starts today rather than repeating a date that has already passed.
        copy.setStartDate(java.time.LocalDate.now(ASIA_TASHKENT));
        copy.setStatus(JobStatus.ACTIVE);
        recomputeExpiry(copy);
        jobRepository.save(copy);
        notifyMatchingWorkers(copy);
        return JobResponse.from(copy);
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
        if (request.urgent() != null) {
            job.setUrgent(request.urgent());
        }
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
        // Deleting is allowed even when blocked: taking your own listing down is never a way
        // around moderation.
        Job job = getOwnedJobIgnoringBlock(employerUser, jobId);
        // The rows cascade, but the files on disk do not — they used to be orphaned forever.
        jobImageRepository.findByJobIdOrderByCreatedAtAsc(job.getId())
                .forEach(image -> fileStorageService.deleteAfterCommit(image.getUrl()));
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

    /** Attaches images already stored on disk (e.g. downloaded from a Telegram message) to a
     *  just-created job — no ownership check, since the caller (the Telegram job wizard) only
     *  ever calls this immediately after creating the job in the same request. */
    @Transactional
    public List<JobImageResponse> attachImageUrls(Long jobId, List<String> urls) {
        Job job = jobRepository.findById(jobId).orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        for (String url : urls) {
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
        fileStorageService.deleteAfterCommit(image.getUrl());
        jobImageRepository.delete(image);
    }

    private Job getOwnedJobIgnoringBlock(User employerUser, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (!job.getEmployer().getUser().getId().equals(employerUser.getId())) {
            throw ApiException.forbidden("Bu buyurtma sizga tegishli emas");
        }
        return job;
    }

    private Job getOwnedJob(User employerUser, Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> ApiException.notFound("Buyurtma topilmadi"));
        if (!job.getEmployer().getUser().getId().equals(employerUser.getId())) {
            throw ApiException.forbidden("Bu buyurtma sizga tegishli emas");
        }
        // An admin block is a moderation decision, so the owner must not be able to edit, reopen
        // or re-publish their way around it. Reads elsewhere already hide blocked jobs.
        if (job.isBlocked()) {
            throw ApiException.forbidden("Buyurtma administrator tomonidan bloklangan");
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

    /** Below this, a median says more about chance than about the market. */
    private static final int MIN_PRICE_GUIDANCE_SAMPLE = 5;

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
