package uz.ishchi.app.location;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "regions")
@Getter
@Setter
@NoArgsConstructor
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(name = "center_lat")
    private Double centerLat;

    @Column(name = "center_lng")
    private Double centerLng;

    @Column(name = "radius_km")
    private Double radiusKm;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "allow_jobs", nullable = false)
    private boolean allowJobs = true;

    @Column(name = "allow_workers", nullable = false)
    private boolean allowWorkers = true;

    @Column(name = "min_salary_rate")
    private Long minSalaryRate;

    @Column(name = "max_salary_rate")
    private Long maxSalaryRate;

    @Column(name = "operation_mode", length = 30)
    private String operationMode = "FULL_ACCESS";

    @Column(name = "notes")
    private String notes;
}
