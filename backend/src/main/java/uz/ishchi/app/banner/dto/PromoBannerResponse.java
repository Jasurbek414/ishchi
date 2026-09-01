package uz.ishchi.app.banner.dto;

import uz.ishchi.app.banner.PromoBanner;
import uz.ishchi.app.common.BannerAudience;

public record PromoBannerResponse(
        Long id,
        String title,
        String subtitle,
        String imageUrl,
        String linkUrl,
        BannerAudience audience,
        Long regionId,
        String regionName,
        Integer sortOrder,
        boolean active
) {
    public static PromoBannerResponse from(PromoBanner b) {
        return new PromoBannerResponse(
                b.getId(), b.getTitle(), b.getSubtitle(), b.getImageUrl(), b.getLinkUrl(),
                b.getAudience(), b.getRegion() != null ? b.getRegion().getId() : null,
                b.getRegion() != null ? b.getRegion().getName() : null,
                b.getSortOrder(), b.isActive()
        );
    }
}
