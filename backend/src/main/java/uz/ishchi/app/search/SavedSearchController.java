package uz.ishchi.app.search;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.search.dto.SavedSearchRequest;
import uz.ishchi.app.search.dto.SavedSearchResponse;
import uz.ishchi.app.security.UserPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/saved-searches")
@RequiredArgsConstructor
public class SavedSearchController {

    private final SavedSearchService savedSearchService;

    @GetMapping
    public List<SavedSearchResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return savedSearchService.list(principal.getUser());
    }

    @PostMapping
    public SavedSearchResponse create(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody SavedSearchRequest request) {
        return savedSearchService.create(principal.getUser(), request);
    }

    @PatchMapping("/{id}")
    public SavedSearchResponse update(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long id,
                                       @Valid @RequestBody SavedSearchRequest request) {
        return savedSearchService.update(principal.getUser(), id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id) {
        savedSearchService.delete(principal.getUser(), id);
    }
}
