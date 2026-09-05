package uz.ishchi.app.landing;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.common.LandingItemType;

import java.time.Instant;

/** A repeatable landing-page block — either a feature highlight or a roadmap entry.
 *  Both shapes are identical (title + description + order), so one table + a
 *  discriminator column stands in for two near-duplicate tables/services. */
@Entity
@Table(name = "landing_items")
@Getter
@Setter
@NoArgsConstructor
public class LandingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LandingItemType type;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
