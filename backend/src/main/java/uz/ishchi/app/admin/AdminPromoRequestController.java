package uz.ishchi.app.admin;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.banner.PromoRequestService;
import uz.ishchi.app.banner.dto.PromoRequestResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/promo-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromoRequestController {

    private final PromoRequestService promoRequestService;

    @GetMapping
    public List<PromoRequestResponse> getAll() {
        return promoRequestService.findAllForAdmin();
    }

    @PostMapping("/{id}/approve")
    public PromoRequestResponse approve(@PathVariable Long id) {
        return promoRequestService.approve(id);
    }

    @PostMapping("/{id}/reject")
    public PromoRequestResponse reject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return promoRequestService.reject(id, reason);
    }
}
