package uz.ishchi.app.tma;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.auth.dto.AuthResponse;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.security.UserPrincipal;
import uz.ishchi.app.tma.dto.*;

@RestController
@RequestMapping("/api/tma")
@RequiredArgsConstructor
public class TmaController {

    private final TmaService tmaService;

    @GetMapping("/bootstrap")
    public TmaBootstrapResponse getBootstrap() {
        return tmaService.getBootstrap();
    }

    @PostMapping("/auth")
    public AuthResponse authenticate(@RequestBody TmaAuthRequest request) {
        return tmaService.authenticate(request);
    }

    @GetMapping("/workers")
    public PageResponse<TmaWorkerDto> searchWorkers(
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long professionId,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        return PageResponse.of(tmaService.searchWorkers(regionId, districtId, professionId, search, pageable));
    }

    @GetMapping("/workers/{id}")
    public TmaWorkerDto getWorker(@PathVariable Long id) {
        return tmaService.getWorker(id);
    }

    @GetMapping("/jobs")
    public PageResponse<TmaJobDto> searchJobs(
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long professionId,
            @RequestParam(required = false) String search,
            Pageable pageable
    ) {
        return PageResponse.of(tmaService.searchJobs(regionId, districtId, professionId, search, pageable));
    }

    @GetMapping("/jobs/{id}")
    public TmaJobDto getJob(@PathVariable Long id) {
        return tmaService.getJob(id);
    }

    @PostMapping("/jobs")
    public TmaJobDto postJob(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TmaPostJobRequest request
    ) {
        return tmaService.postJob(request, principal != null ? principal.getUser() : null);
    }
}
