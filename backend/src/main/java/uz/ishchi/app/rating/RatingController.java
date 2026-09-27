package uz.ishchi.app.rating;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.rating.dto.RatingRequest;
import uz.ishchi.app.rating.dto.RatingResponse;
import uz.ishchi.app.security.UserPrincipal;

@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    public RatingResponse rate(@AuthenticationPrincipal UserPrincipal principal,
                                @Valid @RequestBody RatingRequest request) {
        return ratingService.rate(principal.getUser(), request);
    }

    /** Everything said about one person, newest first. */
    @GetMapping("/user/{userId}")
    public PageResponse<RatingResponse> forUser(@PathVariable Long userId, Pageable pageable) {
        return PageResponse.of(ratingService.listFor(userId, pageable));
    }
}
