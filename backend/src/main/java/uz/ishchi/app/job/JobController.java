package uz.ishchi.app.job;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.job.dto.JobCreateRequest;
import uz.ishchi.app.job.dto.JobImageResponse;
import uz.ishchi.app.common.PaymentType;
import uz.ishchi.app.job.dto.JobResponse;
import uz.ishchi.app.job.dto.PriceGuidanceResponse;
import uz.ishchi.app.job.dto.JobStatusUpdateRequest;
import uz.ishchi.app.job.dto.JobUpdateRequest;
import uz.ishchi.app.security.UserPrincipal;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public PageResponse<JobResponse> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long professionId,
            @RequestParam(required = false) JobType jobType,
            @RequestParam(required = false) BigDecimal minPayment,
            @RequestParam(required = false) BigDecimal maxPayment,
            @RequestParam(required = false) JobStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "newest") String sortBy,
            @RequestParam(required = false) Long nearRegionId,
            @RequestParam(required = false) Long nearDistrictId,
            @RequestParam(required = false) Boolean urgent,
            Pageable pageable
    ) {
        return PageResponse.of(jobService.search(principal.getUser(), regionId, districtId, professionId, jobType,
                minPayment, maxPayment, status, search, sortBy, nearRegionId, nearDistrictId, urgent, pageable));
    }

    /** Payment guidance while filling the job form; open to any signed-in user. */
    @GetMapping("/price-guidance")
    public PriceGuidanceResponse priceGuidance(@RequestParam Long professionId,
                                                @RequestParam(required = false) Long regionId,
                                                @RequestParam PaymentType paymentType) {
        return jobService.priceGuidance(professionId, regionId, paymentType);
    }

    /**
     * Copies a past posting into a new active one. Employers on building sites post the same job
     * over and over; retyping every field each time was the single most repeated piece of work.
     */
    @PostMapping("/{id}/repost")
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobResponse repost(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return jobService.repost(principal.getUser(), id);
    }

    @GetMapping("/map")
    public List<JobResponse> mapSearch(@AuthenticationPrincipal UserPrincipal principal,
                                        @RequestParam(required = false) Long regionId,
                                        @RequestParam(required = false) Long professionId,
                                        @RequestParam(required = false) Double latitude,
                                        @RequestParam(required = false) Double longitude,
                                        @RequestParam(required = false) Double radiusDegrees,
                                        @RequestParam(required = false) Long employerId,
                                        @RequestParam(required = false) Boolean urgent) {
        return jobService.mapSearch(principal.getUser(), regionId, professionId,
                latitude, longitude, radiusDegrees, employerId, urgent);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYER')")
    public PageResponse<JobResponse> myJobs(@AuthenticationPrincipal UserPrincipal principal,
                                             @RequestParam(required = false) JobStatus status,
                                             Pageable pageable) {
        return PageResponse.of(jobService.myJobs(principal.getUser(), status, pageable));
    }

    @GetMapping("/{id}")
    public JobResponse getById(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return jobService.getById(principal.getUser(), id);
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasRole('WORKER')")
    public JobResponse unlock(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return jobService.unlock(principal.getUser(), id);
    }

    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobResponse create(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody JobCreateRequest request) {
        return jobService.create(principal.getUser(), request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobResponse update(@AuthenticationPrincipal UserPrincipal principal,
                               @PathVariable Long id,
                               @Valid @RequestBody JobUpdateRequest request) {
        return jobService.update(principal.getUser(), id, request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobResponse changeStatus(@AuthenticationPrincipal UserPrincipal principal,
                                     @PathVariable Long id,
                                     @Valid @RequestBody JobStatusUpdateRequest request) {
        return jobService.changeStatus(principal.getUser(), id, request.status());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        jobService.delete(principal.getUser(), id);
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('EMPLOYER')")
    public List<JobImageResponse> addImages(@AuthenticationPrincipal UserPrincipal principal,
                                             @PathVariable Long id,
                                             @RequestParam("files") List<MultipartFile> files) {
        return jobService.addImages(principal.getUser(), id, files);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public void removeImage(@AuthenticationPrincipal UserPrincipal principal,
                             @PathVariable Long id,
                             @PathVariable Long imageId) {
        jobService.removeImage(principal.getUser(), id, imageId);
    }
}
