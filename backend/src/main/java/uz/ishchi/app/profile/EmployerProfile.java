package uz.ishchi.app.profile;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.user.User;

import java.time.Instant;

@Entity
@Table(name = "employer_profiles")
@Getter
@Setter
@NoArgsConstructor
public class EmployerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "district_id", nullable = false)
    private District district;

    @Column(columnDefinition = "text")
    private String about;

    private Double latitude;

    private Double longitude;

    /** Denormalised from the ratings table, same as on the worker side. */
    @Column(name = "rating_average", columnDefinition = "numeric(3, 2)")
    private Double ratingAverage;

    @Column(name = "rating_count", nullable = false)
    private int ratingCount = 0;

    // This annotation used to sit above ratingAverage (the doc comment above it had been
    // inserted between the annotation and its field), so Hibernate tried to write the current
    // timestamp into the numeric rating column and every insert or update of an employer profile
    // failed - registering as an employer, editing the profile and switching role from worker.
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
