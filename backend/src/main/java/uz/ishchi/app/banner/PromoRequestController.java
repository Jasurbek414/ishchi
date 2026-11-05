package uz.ishchi.app.banner;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.banner.dto.PromoRequestResponse;
import uz.ishchi.app.common.BannerAudience;
import uz.ishchi.app.security.UserPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/promo-requests")
@RequiredArgsConstructor
public class PromoRequestController {

    private final PromoRequestService promoRequestService;

    @GetMapping("/my")
    public List<PromoRequestResponse> myRequests(@AuthenticationPrincipal UserPrincipal principal) {
        return promoRequestService.myRequests(principal.getUser().getId());
    }

    @PostMapping(consumes = "multipart/form-data")
    public PromoRequestResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String title,
            @RequestParam(required = false) String subtitle,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) BannerAudience audience,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Integer durationDays,
            @RequestParam(required = false) MultipartFile image
    ) {
        return promoRequestService.create(
                principal.getUser(),
                title,
                subtitle,
                linkUrl,
                audience,
                regionId,
                durationDays,
                image
        );
    }

    @DeleteMapping("/{id}")
    public void cancel(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        promoRequestService.cancel(id, principal.getUser().getId());
    }
}
