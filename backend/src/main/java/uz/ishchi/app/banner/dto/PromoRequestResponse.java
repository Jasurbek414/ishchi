package uz.ishchi.app.banner.dto;

import uz.ishchi.app.banner.PromoRequest;
import uz.ishchi.app.banner.PromoRequestStatus;
import uz.ishchi.app.common.BannerAudience;

import java.math.BigDecimal;
import java.time.Instant;

public record PromoRequestResponse(
        Long id,
        Long userId,
        String userPhone,
        String title,
        String subtitle,
        String imageUrl,
        String linkUrl,
        BannerAudience audience,
        Long regionId,
        String regionName,
        Integer durationDays,
        PromoRequestStatus status,
        String rejectionReason,
        BigDecimal price,
        boolean paid,
        Long promoBannerId,
        Instant createdAt,
        Instant reviewedAt
) {
    public static PromoRequestResponse from(PromoRequest r) {
        return new PromoRequestResponse(
                r.getId(),
                r.getUser() != null ? r.getUser().getId() : null,
                r.getUser() != null ? r.getUser().getPhone() : null,
                r.getTitle(),
                r.getSubtitle(),
                r.getImageUrl(),
                r.getLinkUrl(),
                r.getAudience(),
                r.getRegion() != null ? r.getRegion().getId() : null,
                r.getRegion() != null ? r.getRegion().getName() : null,
                r.getDurationDays(),
                r.getStatus(),
                r.getRejectionReason(),
                r.getPrice(),
                r.isPaid(),
                r.getPromoBanner() != null ? r.getPromoBanner().getId() : null,
                r.getCreatedAt(),
                r.getReviewedAt()
        );
    }
}
