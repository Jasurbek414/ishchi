package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.settings.AppSettingsService;
import uz.ishchi.app.settings.dto.AppSettingsResponse;
import uz.ishchi.app.settings.dto.AppSettingsUpdateRequest;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final AppSettingsService appSettingsService;

    @GetMapping
    public AppSettingsResponse get() {
        return appSettingsService.get();
    }

    @PatchMapping
    public AppSettingsResponse update(@Valid @RequestBody AppSettingsUpdateRequest request) {
        return appSettingsService.update(request);
    }
}
