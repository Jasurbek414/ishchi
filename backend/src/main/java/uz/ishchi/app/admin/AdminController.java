package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.admin.dto.ActiveRequest;
import uz.ishchi.app.admin.dto.AdminJobResponse;
import uz.ishchi.app.admin.dto.BlockRequest;
import uz.ishchi.app.admin.dto.AdminUserResponse;
import uz.ishchi.app.admin.dto.StatsResponse;
import uz.ishchi.app.admin.dto.TelegramMessageRequest;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.profile.dto.ProfileResponse;
import uz.ishchi.app.telegram.TelegramService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final TelegramService telegramService;

    @GetMapping("/users")
    public PageResponse<AdminUserResponse> listUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return PageResponse.of(adminService.listUsers(role, search, pageable));
    }

    @PatchMapping("/users/{id}/active")
    public AdminUserResponse setUserActive(@PathVariable Long id, @Valid @RequestBody ActiveRequest request) {
        return adminService.setUserActive(id, request.active());
    }

    @GetMapping("/users/{id}/profile")
    public ProfileResponse getUserProfile(@PathVariable Long id) {
        return adminService.getUserProfile(id);
    }

    @PostMapping("/users/{id}/telegram-message")
    public void sendTelegramMessage(@PathVariable Long id, @Valid @RequestBody TelegramMessageRequest request) {
        telegramService.sendDirectMessage(id, request.text());
    }

    @GetMapping("/jobs")
    public PageResponse<AdminJobResponse> listJobs(
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return PageResponse.of(adminService.listJobs(status, search, pageable));
    }

    @PatchMapping("/jobs/{id}/blocked")
    public AdminJobResponse setJobBlocked(@PathVariable Long id, @Valid @RequestBody BlockRequest request) {
        return adminService.setJobBlocked(id, request.blocked());
    }

    @DeleteMapping("/jobs/{id}")
    public void deleteJob(@PathVariable Long id) {
        adminService.deleteJob(id);
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        return adminService.stats();
    }
}
