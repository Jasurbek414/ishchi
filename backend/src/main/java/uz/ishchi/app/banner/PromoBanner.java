package uz.ishchi.app.banner;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.common.BannerAudience;
import uz.ishchi.app.location.Region;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "promo_banners")
@Getter
@Setter
@NoArgsConstructor
public class PromoBanner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    /** Bo'sh = barcha hududlarga ko'rinadi; belgilansa, faqat shu hududlardagi foydalanuvchilarga. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "promo_banner_regions",
            joinColumns = @JoinColumn(name = "promo_banner_id"),
            inverseJoinColumns = @JoinColumn(name = "region_id")
    )
    private Set<Region> regions = new HashSet<>();

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    /** Null = darhol boshlanadi. */
    @Column(name = "start_at")
    private Instant startAt;

    /** Null = muddatsiz. */
    @Column(name = "end_at")
    private Instant endAt;

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(name = "click_count", nullable = false)
    private long clickCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
