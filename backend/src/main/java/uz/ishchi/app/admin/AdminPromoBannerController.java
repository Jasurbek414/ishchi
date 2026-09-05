package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.admin.dto.ActiveRequest;
import uz.ishchi.app.admin.dto.ReorderRequest;
import uz.ishchi.app.banner.PromoBannerService;
import uz.ishchi.app.banner.dto.PromoBannerResponse;
import uz.ishchi.app.common.BannerAudience;

import java.time.Instant;
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
            @RequestParam(required = false) List<Long> regionIds,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Instant startAt,
            @RequestParam(required = false) Instant endAt,
            @RequestParam(required = false) MultipartFile image
    ) {
        return promoBannerService.create(title, subtitle, linkUrl, audience, regionIds, sortOrder, active, startAt, endAt, image);
    }

    @PatchMapping(value = "/{id}", consumes = "multipart/form-data")
    public PromoBannerResponse update(
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String subtitle,
            @RequestParam(required = false) String linkUrl,
            @RequestParam(required = false) BannerAudience audience,
            @RequestParam(required = false) List<Long> regionIds,
            @RequestParam(required = false, defaultValue = "false") boolean regionsProvided,
            @RequestParam(required = false) Integer sortOrder,
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false, defaultValue = "false") boolean clearStartAt,
            @RequestParam(required = false) Instant startAt,
            @RequestParam(required = false, defaultValue = "false") boolean clearEndAt,
            @RequestParam(required = false) Instant endAt,
            @RequestParam(required = false) MultipartFile image
    ) {
        return promoBannerService.update(id, title, subtitle, linkUrl, audience, regionIds, regionsProvided, sortOrder, active,
                clearStartAt, startAt, clearEndAt, endAt, image);
    }

    @PatchMapping("/{id}/active")
    public void setActive(@PathVariable Long id, @Valid @RequestBody ActiveRequest request) {
        promoBannerService.setActive(id, request.active());
    }

    @PatchMapping("/reorder")
    public void reorder(@Valid @RequestBody ReorderRequest request) {
        promoBannerService.reorder(request.ids());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        promoBannerService.delete(id);
    }
}
