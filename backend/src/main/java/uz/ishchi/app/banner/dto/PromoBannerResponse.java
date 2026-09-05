package uz.ishchi.app.banner.dto;

import uz.ishchi.app.banner.PromoBanner;
import uz.ishchi.app.common.BannerAudience;
import uz.ishchi.app.location.Region;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

public record PromoBannerResponse(
        Long id,
        String title,
        String subtitle,
        String imageUrl,
        String linkUrl,
        BannerAudience audience,
        List<Long> regionIds,
        List<String> regionNames,
        Integer sortOrder,
        boolean active,
        Instant startAt,
        Instant endAt,
        long viewCount,
        long clickCount
) {
    public static PromoBannerResponse from(PromoBanner b) {
        List<Region> regions = b.getRegions().stream()
                .sorted(Comparator.comparing(Region::getName))
                .toList();
        return new PromoBannerResponse(
                b.getId(), b.getTitle(), b.getSubtitle(), b.getImageUrl(), b.getLinkUrl(),
                b.getAudience(),
                regions.stream().map(Region::getId).toList(),
                regions.stream().map(Region::getName).toList(),
                b.getSortOrder(), b.isActive(), b.getStartAt(), b.getEndAt(),
                b.getViewCount(), b.getClickCount()
        );
    }
}
