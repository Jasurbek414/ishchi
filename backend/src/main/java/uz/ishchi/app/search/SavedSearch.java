package uz.ishchi.app.search;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.profession.Profession;
import uz.ishchi.app.user.User;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A filter a worker asked to be told about.
 *
 * <p>Matching workers were already notified of every new job in their profession and region, which
 * is blunt: a plasterer in Namangan hears about everything, relevant or not, and stops reading. A
 * saved search lets them narrow it to what they would actually travel for.
 */
@Entity
@Table(name = "saved_searches")
@Getter
@Setter
@NoArgsConstructor
public class SavedSearch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profession_id")
    private Profession profession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id")
    private District district;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", length = 20)
    private JobType jobType;

    @Column(name = "min_payment", precision = 14, scale = 2)
    private BigDecimal minPayment;

    @Column(nullable = false)
    private boolean notify = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /** True when this job is the kind of work the search asked about. */
    public boolean matches(uz.ishchi.app.job.Job job) {
        if (profession != null && !profession.getId().equals(job.getProfession().getId())) return false;
        if (region != null && !region.getId().equals(job.getRegion().getId())) return false;
        if (district != null && !district.getId().equals(job.getDistrict().getId())) return false;
        if (jobType != null && jobType != job.getJobType()) return false;
        if (minPayment != null && job.getPayment().compareTo(minPayment) < 0) return false;
        return true;
    }
}
