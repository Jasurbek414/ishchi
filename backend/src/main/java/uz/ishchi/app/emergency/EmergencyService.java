package uz.ishchi.app.emergency;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.user.User;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.emergency.dto.*;
import uz.ishchi.app.notification.NotificationService;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;

import java.time.Instant;
import java.util.Map;

@Service
public class EmergencyService {

    private final EmergencyApplicationRepository applicationRepository;
    private final WorkerProfileRepository workerProfileRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public EmergencyService(
            EmergencyApplicationRepository applicationRepository,
            WorkerProfileRepository workerProfileRepository,
            FileStorageService fileStorageService,
            NotificationService notificationService
    ) {
        this.applicationRepository = applicationRepository;
        this.workerProfileRepository = workerProfileRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public ContractStatusResponse getWorkerContractStatus(User user) {
        WorkerProfile profile = workerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.badRequest("Ishchi profili topilmadi"));

        var appOpt = applicationRepository.findTopByWorkerIdOrderByCreatedAtDesc(profile.getId());

        if (appOpt.isEmpty()) {
            return new ContractStatusResponse(
                    profile.isEmergency(),
                    null,
                    null,
                    null,
                    user.getPhone(),
                    null,
                    null,
                    null,
                    null,
                    profile.getExperienceYears(),
                    profile.getAbout(),
                    null,
                    null,
                    null,
                    ContractStatusResponse.DEFAULT_TERMS
            );
        }

        var app = appOpt.get();
        return new ContractStatusResponse(
                profile.isEmergency(),
                app.getStatus(),
                app.getId(),
                app.getCategory(),
                app.getPhone(),
                app.getPassportPhotoUrl(),
                app.getPassportBackUrl(),
                app.getCertificateUrl(),
                app.getToolsPhotoUrl(),
                app.getExperienceYears(),
                app.getDescription(),
                app.getRejectionReason(),
                app.getCreatedAt(),
                app.getReviewedAt(),
                ContractStatusResponse.DEFAULT_TERMS
        );
    }

    @Transactional
    public ContractStatusResponse submitApplication(
            User user,
            ContractApplicationRequest request,
            MultipartFile passportPhoto,
            MultipartFile passportBack,
            MultipartFile certificate,
            MultipartFile toolsPhoto
    ) {
        if (!request.agreedToTerms()) {
            throw ApiException.badRequest("Shartnoma shartlariga rozilik bildirilishi shart");
        }

        WorkerProfile profile = workerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> ApiException.badRequest("Ishchi profili topilmadi"));

        // If there is an existing PENDING application, do not create duplicate
        var existingOpt = applicationRepository.findTopByWorkerIdOrderByCreatedAtDesc(profile.getId());
        if (existingOpt.isPresent() && existingOpt.get().getStatus() == EmergencyApplicationStatus.PENDING) {
            throw ApiException.badRequest("Sizning arizangiz hozirda administrator tomonidan ko'rib chiqilmoqda");
        }

        EmergencyApplication app = new EmergencyApplication();
        app.setWorker(profile);
        String defaultName = ((profile.getFirstName() != null ? profile.getFirstName() : "") + " "
                + (profile.getLastName() != null ? profile.getLastName() : "")).trim();
        app.setFullName(request.fullName() != null && !request.fullName().isBlank()
                ? request.fullName().trim() : (defaultName.isEmpty() ? user.getPhone() : defaultName));
        app.setPhone(request.phone() != null && !request.phone().isBlank()
                ? request.phone().trim() : user.getPhone());
        app.setCategory(request.category() != null && !request.category().isBlank()
                ? request.category().trim() : "Favqulodda usta");
        app.setPassportData(request.passportData());
        app.setExperienceYears(request.experienceYears());
        app.setDescription(request.description());
        app.setTelegramUsername(request.telegramUsername());
        app.setStatus(EmergencyApplicationStatus.PENDING);
        app.setCreatedAt(Instant.now());
        app.setUpdatedAt(Instant.now());

        if (passportPhoto != null && !passportPhoto.isEmpty()) {
            app.setPassportPhotoUrl(fileStorageService.storeContractDocument(passportPhoto));
        }
        if (passportBack != null && !passportBack.isEmpty()) {
            app.setPassportBackUrl(fileStorageService.storeContractDocument(passportBack));
        }
        if (certificate != null && !certificate.isEmpty()) {
            app.setCertificateUrl(fileStorageService.storeContractDocument(certificate));
        }
        if (toolsPhoto != null && !toolsPhoto.isEmpty()) {
            app.setToolsPhotoUrl(fileStorageService.storeContractDocument(toolsPhoto));
        }

        applicationRepository.save(app);

        return getWorkerContractStatus(user);
    }

    @Transactional(readOnly = true)
    public Page<AdminEmergencyApplicationResponse> listApplications(EmergencyApplicationStatus status, Pageable pageable) {
        Page<EmergencyApplication> page = (status != null)
                ? applicationRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : applicationRepository.findAllByOrderByCreatedAtDesc(pageable);

        return page.map(AdminEmergencyApplicationResponse::from);
    }

    @Transactional(readOnly = true)
    public AdminEmergencyStatsResponse getStats() {
        long pending = applicationRepository.countByStatus(EmergencyApplicationStatus.PENDING);
        long approved = applicationRepository.countByStatus(EmergencyApplicationStatus.APPROVED);
        long rejected = applicationRepository.countByStatus(EmergencyApplicationStatus.REJECTED);
        long totalSpecialists = applicationRepository.countApprovedSpecialists();

        return new AdminEmergencyStatsResponse(pending, approved, rejected, totalSpecialists);
    }

    @Transactional
    public AdminEmergencyApplicationResponse approveApplication(Long applicationId, String adminNotes) {
        EmergencyApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Ariza topilmadi"));

        app.setStatus(EmergencyApplicationStatus.APPROVED);
        app.setAdminNotes(adminNotes);
        app.setRejectionReason(null);
        app.setReviewedAt(Instant.now());
        app.setUpdatedAt(Instant.now());

        WorkerProfile worker = app.getWorker();
        if (worker != null) {
            worker.setEmergency(true);
            workerProfileRepository.save(worker);

            if (worker.getUser() != null) {
                notificationService.sendToUser(
                        worker.getUser(),
                        "🎉 Shartnoma tasdiqlandi!",
                        "Tabriklaymiz! Sizning favqulodda va tezkor mutaxassis arizangiz qabul qilindi. Profilingiz 'Favqulodda mutaxassis' bo'limida ko'rinadi.",
                        "emergency_approved",
                        Map.of("type", "emergency_approved", "applicationId", String.valueOf(app.getId()))
                );
            }
        }

        applicationRepository.save(app);
        return AdminEmergencyApplicationResponse.from(app);
    }

    @Transactional
    public AdminEmergencyApplicationResponse rejectApplication(Long applicationId, String reason) {
        EmergencyApplication app = applicationRepository.findById(applicationId)
                .orElseThrow(() -> ApiException.notFound("Ariza topilmadi"));

        app.setStatus(EmergencyApplicationStatus.REJECTED);
        app.setRejectionReason(reason);
        app.setReviewedAt(Instant.now());
        app.setUpdatedAt(Instant.now());

        WorkerProfile worker = app.getWorker();
        if (worker != null) {
            worker.setEmergency(false);
            workerProfileRepository.save(worker);

            if (worker.getUser() != null) {
                String body = reason != null && !reason.isBlank()
                        ? "Favqulodda mutaxassis arizangiz rad etildi: " + reason
                        : "Favqulodda mutaxassis arizangiz ma'lumotlar to'liq emasligi sababli rad etildi. Qaytadan ariza topshirishingiz mumkin.";

                notificationService.sendToUser(
                        worker.getUser(),
                        "Ariza rad etildi",
                        body,
                        "emergency_rejected",
                        Map.of("type", "emergency_rejected", "applicationId", String.valueOf(app.getId()))
                );
            }
        }

        applicationRepository.save(app);
        return AdminEmergencyApplicationResponse.from(app);
    }

    @Transactional
    public boolean toggleWorkerEmergency(Long workerId, boolean emergency) {
        WorkerProfile worker = workerProfileRepository.findById(workerId)
                .orElseThrow(() -> ApiException.notFound("Ishchi topilmadi"));

        worker.setEmergency(emergency);
        workerProfileRepository.save(worker);
        return emergency;
    }
}
