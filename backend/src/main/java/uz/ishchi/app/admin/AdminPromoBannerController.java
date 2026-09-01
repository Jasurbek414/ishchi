package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.admin.dto.ActiveRequest;
import uz.ishchi.app.banner.PromoBannerService;
import uz.ishchi.app.banner.dto.PromoBannerResponse;
import uz.ishchi.app.common.BannerAudience;

import java.util.List;

@RestController
@RequestMapping("/api/admin/promo-banners")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromoBannerController {

    private final PromoBannerService promoBannerService;

    @GetMapping
    public List<PromoBannerResponse> getAll() {
        return promoBannerService.findAllForAdmin();
    }

    @PostMapping(consumes = "multipart/form-data")
    public PromoBannerResponse create(
            @RequestParam String title,
            @RequestParam(required = false) String subtitle,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) BannerAudience audience,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) MultipartFile image
    ) {
        return promoBannerService.create(title, subtitle, linkUrl, audience, regionId, sortOrder, active, image);
    }

    @PatchMapping(value = "/{id}", consumes = "multipart/form-data")
    public PromoBannerResponse update(
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String subtitle,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) BannerAudience audience,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false, defaultValue = "false") boolean clearRegion,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) MultipartFile image
    ) {
        return promoBannerService.update(id, title, subtitle, linkUrl, audience, regionId, clearRegion, sortOrder, active, image);
    }

    @PatchMapping("/{id}/active")
    public void setActive(@PathVariable Long id, @Valid @RequestBody ActiveRequest request) {
        promoBannerService.setActive(id, request.active());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        promoBannerService.delete(id);
    }
}
