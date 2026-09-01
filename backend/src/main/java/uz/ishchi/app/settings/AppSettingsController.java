package uz.ishchi.app.settings;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.settings.dto.AppSettingsResponse;

@RestController
@RequestMapping("/api/app-settings")
@RequiredArgsConstructor
public class AppSettingsController {

    private final AppSettingsService appSettingsService;

    @GetMapping
    public AppSettingsResponse get() {
        return appSettingsService.get();
    }
}
