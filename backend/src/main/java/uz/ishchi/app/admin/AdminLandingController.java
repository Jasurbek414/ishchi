package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.admin.dto.ReorderRequest;
import uz.ishchi.app.landing.LandingService;
import uz.ishchi.app.landing.dto.LandingContentUpdateRequest;
import uz.ishchi.app.landing.dto.LandingItemRequest;
import uz.ishchi.app.landing.dto.LandingItemUpdateRequest;
import uz.ishchi.app.landing.dto.LandingResponse;

@RestController
@RequestMapping("/api/admin/landing")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminLandingController {

    private final LandingService landingService;

    @GetMapping
    public LandingResponse get() {
        return landingService.get();
    }

    @PatchMapping
    public LandingResponse updateContent(@Valid @RequestBody LandingContentUpdateRequest request) {
        return landingService.updateContent(request);
    }

    @PostMapping("/items")
    public void createItem(@Valid @RequestBody LandingItemRequest request) {
        landingService.createItem(request);
    }

    @PatchMapping("/items/{id}")
    public void updateItem(@PathVariable Long id, @Valid @RequestBody LandingItemUpdateRequest request) {
        landingService.updateItem(id, request);
    }

    @PatchMapping("/items/reorder")
    public void reorderItems(@Valid @RequestBody ReorderRequest request) {
        landingService.reorderItems(request.ids());
    }

    @DeleteMapping("/items/{id}")
    public void deleteItem(@PathVariable Long id) {
        landingService.deleteItem(id);
    }
}
