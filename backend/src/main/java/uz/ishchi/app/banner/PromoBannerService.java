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

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
        return promoBannerRepository.findVisible(audiences, regionId, Instant.now()).stream()
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
                                       List<Long> regionIds, Integer sortOrder, Boolean active,
                                       Instant startAt, Instant endAt, MultipartFile image) {
        PromoBanner banner = new PromoBanner();
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setLinkUrl(linkUrl);
        banner.setAudience(audience != null ? audience : BannerAudience.ALL);
        banner.setRegions(resolveRegions(regionIds));
        banner.setSortOrder(sortOrder != null ? sortOrder : 0);
        banner.setActive(active == null || active);
        banner.setStartAt(startAt);
        banner.setEndAt(endAt);
        if (image != null && !image.isEmpty()) {
            fileStorageService.deleteAfterCommit(banner.getImageUrl());
            banner.setImageUrl(fileStorageService.storePromoBannerImage(image));
        }
        return PromoBannerResponse.from(promoBannerRepository.save(banner));
    }

    @Transactional
    public PromoBannerResponse update(Long id, String title, String subtitle, String linkUrl, BannerAudience audience,
                                       List<Long> regionIds, boolean regionsProvided, Integer sortOrder, Boolean active,
                                       boolean clearStartAt, Instant startAt, boolean clearEndAt, Instant endAt,
                                       MultipartFile image) {
        PromoBanner banner = promoBannerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Banner topilmadi"));
        if (title != null) banner.setTitle(title);
        if (subtitle != null) banner.setSubtitle(subtitle);
        if (linkUrl != null) banner.setLinkUrl(linkUrl);
        if (audience != null) banner.setAudience(audience);
        if (regionsProvided) banner.setRegions(resolveRegions(regionIds));
        if (sortOrder != null) banner.setSortOrder(sortOrder);
        if (active != null) banner.setActive(active);
        if (startAt != null) {
            banner.setStartAt(startAt);
        } else if (clearStartAt) {
            banner.setStartAt(null);
        }
        if (endAt != null) {
            banner.setEndAt(endAt);
        } else if (clearEndAt) {
            banner.setEndAt(null);
        }
        if (image != null && !image.isEmpty()) {
            fileStorageService.deleteAfterCommit(banner.getImageUrl());
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
    public void reorder(List<Long> orderedIds) {
        List<PromoBanner> banners = promoBannerRepository.findAllById(orderedIds);
        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            int sortOrder = i;
            banners.stream().filter(b -> b.getId().equals(id)).findFirst()
                    .ifPresent(b -> b.setSortOrder(sortOrder));
        }
    }

    @Transactional
    public void recordView(Long id) {
        promoBannerRepository.incrementViewCount(id);
    }

    @Transactional
    public void recordClick(Long id) {
        promoBannerRepository.incrementClickCount(id);
    }

    @Transactional
    public void delete(Long id) {
        PromoBanner banner = promoBannerRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Banner topilmadi"));
        fileStorageService.deleteAfterCommit(banner.getImageUrl());
        promoBannerRepository.delete(banner);
    }

    private Set<Region> resolveRegions(List<Long> regionIds) {
        if (regionIds == null || regionIds.isEmpty()) return new HashSet<>();
        List<Region> found = regionRepository.findAllById(regionIds);
        if (found.size() != new HashSet<>(regionIds).size()) {
            throw ApiException.badRequest("Bir yoki bir nechta hudud topilmadi");
        }
        return new HashSet<>(found);
    }
}
