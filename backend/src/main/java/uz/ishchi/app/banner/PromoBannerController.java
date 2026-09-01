package uz.ishchi.app.banner;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.banner.dto.PromoBannerResponse;
import uz.ishchi.app.common.BannerAudience;

import java.util.List;

@RestController
@RequestMapping("/api/promo-banners")
@RequiredArgsConstructor
public class PromoBannerController {

    private final PromoBannerService promoBannerService;

    @GetMapping
    public List<PromoBannerResponse> list(@RequestParam(required = false) BannerAudience audience,
                                           @RequestParam(required = false) Long regionId) {
        return promoBannerService.forAudience(audience, regionId);
    }
}
