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
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import uz.ishchi.app.profile.ProfileService;
import uz.ishchi.app.profile.dto.PresetAvatarRequest;

@RestController
@RequestMapping("/api/tma")
@RequiredArgsConstructor
public class TmaController {

    private final TmaService tmaService;
    private final ProfileService profileService;

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

    @GetMapping("/profile")
    public TmaProfileDto getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        return tmaService.getProfile(principal.getId());
    }

    @PostMapping("/switch-role")
    public AuthResponse switchRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TmaSwitchRoleRequest request
    ) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        return tmaService.switchRole(principal.getId(), request);
    }

    @PostMapping("/send-otp")
    public TmaSendOtpResponse sendOtp(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TmaSendOtpRequest request
    ) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        return tmaService.sendOtp(principal.getId(), request);
    }

    @PostMapping("/link-account")
    public AuthResponse linkAccount(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody TmaLinkAccountRequest request
    ) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        return tmaService.linkAccount(principal.getId(), request);
    }

    @PostMapping("/register")
    public AuthResponse register(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody uz.ishchi.app.tma.dto.TmaRegisterRequest request
    ) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        return tmaService.register(principal.getId(), request);
    }

    @PostMapping("/toggle-availability")
    public java.util.Map<String, Object> toggleAvailability(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        boolean available = tmaService.toggleAvailability(principal.getId());
        return java.util.Map.of("available", available);
    }

    @PostMapping(value = "/avatar", consumes = "multipart/form-data")
    public TmaProfileDto uploadAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file
    ) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        profileService.uploadAvatar(principal.getUser(), file);
        return tmaService.getProfile(principal.getId());
    }

    @PostMapping("/avatar/preset")
    public TmaProfileDto selectPresetAvatar(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PresetAvatarRequest request
    ) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        profileService.setPresetAvatar(principal.getUser(), request.avatarUrl());
        return tmaService.getProfile(principal.getId());
    }

    @DeleteMapping("/avatar")
    public TmaProfileDto deleteAvatar(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw uz.ishchi.app.common.exception.ApiException.unauthorized("Tizimga kirish talab qilinadi");
        }
        profileService.deleteAvatar(principal.getUser());
        return tmaService.getProfile(principal.getId());
    }
}
