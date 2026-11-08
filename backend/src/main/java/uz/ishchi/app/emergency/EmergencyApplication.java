package uz.ishchi.app.emergency;

import jakarta.persistence.*;
import uz.ishchi.app.profile.WorkerProfile;

import java.time.Instant;

@Entity
@Table(name = "emergency_applications")
public class EmergencyApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "worker_id", nullable = false)
    private WorkerProfile worker;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "phone", nullable = false, length = 20)
    private String phone;

    @Column(name = "category", nullable = false, length = 100)
    private String category;

    @Column(name = "passport_data", length = 100)
    private String passportData;

    @Column(name = "passport_photo_url", length = 500)
    private String passportPhotoUrl;

    @Column(name = "passport_back_url", length = 500)
    private String passportBackUrl;

    @Column(name = "certificate_url", length = 500)
    private String certificateUrl;

    @Column(name = "tools_photo_url", length = 500)
    private String toolsPhotoUrl;

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Column(name = "telegram_username", length = 100)
    private String telegramUsername;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private EmergencyApplicationStatus status = EmergencyApplicationStatus.PENDING;

    @Column(name = "admin_notes", columnDefinition = "text")
    private String adminNotes;

    @Column(name = "rejection_reason", columnDefinition = "text")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public EmergencyApplication() {
    }

    public Long getId() {
        return id;
    }

    public WorkerProfile getWorker() {
        return worker;
    }

    public void setWorker(WorkerProfile worker) {
        this.worker = worker;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPassportData() {
        return passportData;
    }

    public void setPassportData(String passportData) {
        this.passportData = passportData;
    }

    public String getPassportPhotoUrl() {
        return passportPhotoUrl;
    }

    public void setPassportPhotoUrl(String passportPhotoUrl) {
        this.passportPhotoUrl = passportPhotoUrl;
    }

    public String getPassportBackUrl() {
        return passportBackUrl;
    }

    public void setPassportBackUrl(String passportBackUrl) {
        this.passportBackUrl = passportBackUrl;
    }

    public String getCertificateUrl() {
        return certificateUrl;
    }

    public void setCertificateUrl(String certificateUrl) {
        this.certificateUrl = certificateUrl;
    }

    public String getToolsPhotoUrl() {
        return toolsPhotoUrl;
    }

    public void setToolsPhotoUrl(String toolsPhotoUrl) {
        this.toolsPhotoUrl = toolsPhotoUrl;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getTelegramUsername() {
        return telegramUsername;
    }

    public void setTelegramUsername(String telegramUsername) {
        this.telegramUsername = telegramUsername;
    }

    public EmergencyApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(EmergencyApplicationStatus status) {
        this.status = status;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
