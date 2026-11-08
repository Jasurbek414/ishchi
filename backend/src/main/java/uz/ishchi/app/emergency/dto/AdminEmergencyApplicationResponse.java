package uz.ishchi.app.emergency.dto;

import uz.ishchi.app.emergency.EmergencyApplication;
import uz.ishchi.app.emergency.EmergencyApplicationStatus;

import java.time.Instant;

public record AdminEmergencyApplicationResponse(
        Long id,
        Long workerId,
        Long userId,
        String workerFullName,
        String workerAvatarUrl,
        String phone,
        String category,
        String passportData,
        String passportPhotoUrl,
        String passportBackUrl,
        String certificateUrl,
        String toolsPhotoUrl,
        Integer experienceYears,
        String description,
        String telegramUsername,
        EmergencyApplicationStatus status,
        String adminNotes,
        String rejectionReason,
        Instant createdAt,
        Instant reviewedAt,
        boolean workerCurrentlyEmergency
) {
    public static AdminEmergencyApplicationResponse from(EmergencyApplication app) {
        var w = app.getWorker();
        var u = w != null ? w.getUser() : null;
        return new AdminEmergencyApplicationResponse(
                app.getId(),
                w != null ? w.getId() : null,
                u != null ? u.getId() : null,
                app.getFullName(),
                w != null ? w.getAvatarUrl() : null,
                app.getPhone(),
                app.getCategory(),
                app.getPassportData(),
                app.getPassportPhotoUrl(),
                app.getPassportBackUrl(),
                app.getCertificateUrl(),
                app.getToolsPhotoUrl(),
                app.getExperienceYears(),
                app.getDescription(),
                app.getTelegramUsername(),
                app.getStatus(),
                app.getAdminNotes(),
                app.getRejectionReason(),
                app.getCreatedAt(),
                app.getReviewedAt(),
                w != null && w.isEmergency()
        );
    }
}
