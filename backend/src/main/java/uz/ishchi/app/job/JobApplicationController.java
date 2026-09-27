package uz.ishchi.app.job;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.ApplicationStatus;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.job.dto.JobApplicationResponse;
import uz.ishchi.app.security.UserPrincipal;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class JobApplicationController {

    private final JobApplicationService applicationService;

    /** "Javob berdim" — the worker puts their hand up. Free, on purpose. */
    @PostMapping("/api/jobs/{jobId}/apply")
    @PreAuthorize("hasRole('WORKER')")
    public JobApplicationResponse apply(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long jobId) {
        return applicationService.apply(principal.getUser(), jobId);
    }

    @DeleteMapping("/api/jobs/{jobId}/apply")
    @PreAuthorize("hasRole('WORKER')")
    public void withdraw(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long jobId) {
        applicationService.withdraw(principal.getUser(), jobId);
    }

    /** The employer's shortlist for one of their own jobs. */
    @GetMapping("/api/jobs/{jobId}/applications")
    @PreAuthorize("hasRole('EMPLOYER')")
    public List<JobApplicationResponse> forJob(@AuthenticationPrincipal UserPrincipal principal,
                                                @PathVariable Long jobId) {
        return applicationService.listForEmployer(principal.getUser(), jobId);
    }

    @PatchMapping("/api/jobs/{jobId}/applications/{workerUserId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobApplicationResponse decide(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long jobId,
                                          @PathVariable Long workerUserId,
                                          @RequestParam ApplicationStatus status) {
        return applicationService.decide(principal.getUser(), jobId, workerUserId, status);
    }

    /** The worker's own history of responses. */
    @GetMapping("/api/my/applications")
    @PreAuthorize("hasRole('WORKER')")
    public PageResponse<JobApplicationResponse> mine(@AuthenticationPrincipal UserPrincipal principal,
                                                      Pageable pageable) {
        return PageResponse.of(applicationService.listForWorker(principal.getUser(), pageable));
    }
}
