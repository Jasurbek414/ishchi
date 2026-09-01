package uz.ishchi.app.notification;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.notification.dto.DeviceTokenRequest;
import uz.ishchi.app.notification.dto.UnregisterTokenRequest;
import uz.ishchi.app.security.UserPrincipal;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/device-token")
    public void registerToken(@AuthenticationPrincipal UserPrincipal principal,
                               @Valid @RequestBody DeviceTokenRequest request) {
        notificationService.registerToken(principal.getUser(), request.token(), request.platform());
    }

    @DeleteMapping("/device-token")
    public void unregisterToken(@AuthenticationPrincipal UserPrincipal principal,
                                 @Valid @RequestBody UnregisterTokenRequest request) {
        notificationService.unregisterToken(principal.getUser(), request.token());
    }
}
