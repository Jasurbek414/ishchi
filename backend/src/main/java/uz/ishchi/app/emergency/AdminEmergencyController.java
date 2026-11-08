package uz.ishchi.app.emergency;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.emergency.dto.AdminEmergencyApplicationResponse;
import uz.ishchi.app.emergency.dto.AdminEmergencyStatsResponse;
import uz.ishchi.app.emergency.dto.AdminReviewRequest;

@RestController
@RequestMapping("/api/admin/emergency")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmergencyController {

    private final EmergencyService emergencyService;

    public AdminEmergencyController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @GetMapping("/applications")
    public ResponseEntity<PageResponse<AdminEmergencyApplicationResponse>> listApplications(
            @RequestParam(required = false) EmergencyApplicationStatus status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(PageResponse.of(emergencyService.listApplications(status, pageable)));
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminEmergencyStatsResponse> getStats() {
        return ResponseEntity.ok(emergencyService.getStats());
    }

    @PostMapping("/applications/{id}/approve")
    public ResponseEntity<AdminEmergencyApplicationResponse> approve(
            @PathVariable Long id,
            @RequestBody(required = false) AdminReviewRequest request
    ) {
        String note = request != null ? request.note() : null;
        return ResponseEntity.ok(emergencyService.approveApplication(id, note));
    }

    @PostMapping("/applications/{id}/reject")
    public ResponseEntity<AdminEmergencyApplicationResponse> reject(
            @PathVariable Long id,
            @RequestBody(required = false) AdminReviewRequest request
    ) {
        String reason = request != null ? request.reason() : null;
        return ResponseEntity.ok(emergencyService.rejectApplication(id, reason));
    }

    @PostMapping("/workers/{workerId}/toggle")
    public ResponseEntity<Boolean> toggleWorkerEmergency(
            @PathVariable Long workerId,
            @RequestParam boolean emergency
    ) {
        return ResponseEntity.ok(emergencyService.toggleWorkerEmergency(workerId, emergency));
    }
}
