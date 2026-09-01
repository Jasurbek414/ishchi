package uz.ishchi.app.banner;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.ishchi.app.banner.dto.PromoBannerResponse;
import uz.ishchi.app.common.BannerAudience;
import uz.ishchi.app.common.FileStorageService;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.location.RegionRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PromoBannerService {

    private final PromoBannerRepository promoBannerRepository;
    private final RegionRepository regionRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<PromoBannerResponse> forAudience(BannerAudience audience, Long regionId) {
        List<BannerAudience> audiences = audience == null || audience == BannerAudience.ALL
                ? List.of(BannerAudience.ALL)
                : List.of(BannerAudience.ALL, audience);
        return promoBannerRepository.findVisible(audiences, regionId).stream()
                .map(PromoBannerResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PromoBannerResponse> findAllForAdmin() {
        return promoBannerRepository.findAllByOrderBySortOrderAscCreatedAtAsc().stream()
                .map(PromoBannerResponse::from)
                .toList();
    }

    @Transactional
    public PromoBannerResponse create(String title, String subtitle, String linkUrl, BannerAudience audience,
                                       Long regionId, Integer sortOrder, Boolean active, MultipartFile image) {
        PromoBanner banner = new PromoBanner();
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setLinkUrl(linkUrl);
        banner.setAudience(audience != null ? audience : BannerAudience.ALL);
        banner.setRegion(resolveRegion(regionId));
        banner.setSortOrder(sortOrder != null ? sortOrder : 0);
        banner.setActive(active == null || active);
        if (image != null && !image.isEmpty()) {
            banner.setImageUrl(fileStorageService.storePromoBannerImage(image));
        }
        return PromoBannerResponse.from(promoBannerRepository.save(banner));
    }

    @Transactional
    public PromoBannerResponse update(Long id, String title, String subtitle, String linkUrl, BannerAudience audience,
                                       Long regionId, boolean clearRegion, Integer sortOrder, Boolean active, MultipartFile image) {
        PromoBanner banner = promoBannerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Banner topilmadi"));
        if (title != null) banner.setTitle(title);
        if (subtitle != null) banner.setSubtitle(subtitle);
        if (linkUrl != null) banner.setLinkUrl(linkUrl);
        if (audience != null) banner.setAudience(audience);
        if (regionId != null) {
            banner.setRegion(resolveRegion(regionId));
        } else if (clearRegion) {
            banner.setRegion(null);
        }
        if (sortOrder != null) banner.setSortOrder(sortOrder);
        if (active != null) banner.setActive(active);
        if (image != null && !image.isEmpty()) {
            banner.setImageUrl(fileStorageService.storePromoBannerImage(image));
        }
        return PromoBannerResponse.from(banner);
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        PromoBanner banner = promoBannerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Banner topilmadi"));
        banner.setActive(active);
    }

    @Transactional
    public void delete(Long id) {
        if (!promoBannerRepository.existsById(id)) {
            throw ApiException.notFound("Banner topilmadi");
        }
        promoBannerRepository.deleteById(id);
    }

    private Region resolveRegion(Long regionId) {
        if (regionId == null) return null;
        return regionRepository.findById(regionId)
                .orElseThrow(() -> ApiException.badRequest("Viloyat topilmadi"));
    }
}
