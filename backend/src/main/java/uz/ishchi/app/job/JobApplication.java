package uz.ishchi.app.job;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import uz.ishchi.app.common.ApplicationStatus;
import uz.ishchi.app.user.User;

import java.time.Instant;

/**
 * A worker's response to a job — the record that the two sides came into contact.
 *
 * <p>Everything that needs to know "who worked with whom" hangs off this: ratings, the employer's
 * completion record, a worker's history. Before it existed the platform only knew that a job had
 * been posted and read, never what came of it.
 */
@Entity
@Table(name = "job_applications", uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "worker_id"}))
@Getter
@Setter
@NoArgsConstructor
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status = ApplicationStatus.INTERESTED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public JobApplication(Job job, User worker) {
        this.job = job;
        this.worker = worker;
    }
}
