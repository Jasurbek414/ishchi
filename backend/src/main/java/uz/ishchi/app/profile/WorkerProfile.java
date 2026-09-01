package uz.ishchi.app.profile;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;
import uz.ishchi.app.common.WorkPreference;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.user.User;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "worker_profiles")
@Getter
@Setter
@NoArgsConstructor
public class WorkerProfile {

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

    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(columnDefinition = "text")
    private String about;

    @Column(name = "is_available", nullable = false)
    private boolean available = true;

    private Double latitude;

    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_preference", length = 20)
    private WorkPreference workPreference;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "worker_professions",
            joinColumns = @JoinColumn(name = "worker_id"),
            inverseJoinColumns = @JoinColumn(name = "profession_id")
    )
    private Set<uz.ishchi.app.profession.Profession> professions = new HashSet<>();

    @Column(name = "has_driver_license", nullable = false)
    private boolean hasDriverLicense = false;

    /** Free-form license category list, e.g. "B, C". Only meaningful when hasDriverLicense is true. */
    @Column(name = "driver_license_categories", length = 50)
    private String driverLicenseCategories;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
