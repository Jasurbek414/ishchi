package uz.ishchi.app.landing;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.landing.dto.LandingResponse;

@RestController
@RequestMapping("/api/landing")
@RequiredArgsConstructor
public class LandingController {

    private final LandingService landingService;

    @GetMapping
    public LandingResponse get() {
        return landingService.get();
    }
}
