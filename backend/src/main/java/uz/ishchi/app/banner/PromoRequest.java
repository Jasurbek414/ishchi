package uz.ishchi.app.banner;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.common.BannerAudience;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.user.User;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "promo_requests")
@Getter
@Setter
@NoArgsConstructor
public class PromoRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 300)
    private String subtitle;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "link_url", length = 300)
    private String linkUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BannerAudience audience = BannerAudience.ALL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays = 7;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PromoRequestStatus status = PromoRequestStatus.PENDING;

    @Column(name = "rejection_reason", length = 300)
    private String rejectionReason;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "is_paid", nullable = false)
    private boolean paid = true;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promo_banner_id")
    private PromoBanner promoBanner;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
