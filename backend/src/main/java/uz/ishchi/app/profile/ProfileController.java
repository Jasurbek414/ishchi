package uz.ishchi.app.profile;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.auth.AuthService;
import uz.ishchi.app.auth.dto.AuthResponse;
import uz.ishchi.app.auth.dto.ChangePasswordRequest;
import uz.ishchi.app.auth.dto.MessageResponse;
import uz.ishchi.app.auth.dto.SwitchRoleRequest;
import uz.ishchi.app.profile.dto.ProfileResponse;
import uz.ishchi.app.profile.dto.ProfileUpdateRequest;
import uz.ishchi.app.profile.dto.WorkExperienceRequest;
import uz.ishchi.app.security.UserPrincipal;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final AuthService authService;

    @GetMapping
    public ProfileResponse getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return profileService.getProfile(principal.getUser());
    }

    @PatchMapping
    public ProfileResponse updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody ProfileUpdateRequest request) {
        return profileService.updateProfile(principal.getUser(), request);
    }

    @PostMapping(value = "/avatar", consumes = "multipart/form-data")
    public ProfileResponse uploadAvatar(@AuthenticationPrincipal UserPrincipal principal,
                                         @RequestParam("file") MultipartFile file) {
        return profileService.uploadAvatar(principal.getUser(), file);
    }

    @PostMapping("/change-password")
    public MessageResponse changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                           @Valid @RequestBody ChangePasswordRequest request) {
        return authService.changePassword(principal.getUser(), request.currentPassword(), request.newPassword());
    }

    @PostMapping("/switch-role")
    public AuthResponse switchRole(@AuthenticationPrincipal UserPrincipal principal,
                                    @RequestBody(required = false) SwitchRoleRequest request) {
        return authService.switchRole(principal.getUser(), request == null ? null : request.professionIds());
    }

    @PostMapping("/experience")
    public ProfileResponse addExperience(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody WorkExperienceRequest request) {
        return profileService.addExperience(principal.getUser(), request);
    }

    @PatchMapping("/experience/{id}")
    public ProfileResponse updateExperience(@AuthenticationPrincipal UserPrincipal principal,
                                             @PathVariable Long id,
                                             @Valid @RequestBody WorkExperienceRequest request) {
        return profileService.updateExperience(principal.getUser(), id, request);
    }

    @DeleteMapping("/experience/{id}")
    public ProfileResponse deleteExperience(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        return profileService.deleteExperience(principal.getUser(), id);
    }
}
