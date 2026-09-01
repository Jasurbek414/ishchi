package uz.ishchi.app.job;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.user.User;

import java.time.Instant;

/**
 * Records that a worker has paid the one-time job-view fee to unlock a job's contact
 * details — the unlock persists for that worker+job pair forever, so re-opening an
 * already-unlocked job never charges again.
 */
@Entity
@Table(name = "job_unlocks", uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "worker_id"}))
@Getter
@Setter
@NoArgsConstructor
public class JobUnlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @CreationTimestamp
    @Column(name = "unlocked_at", nullable = false, updatable = false)
    private Instant unlockedAt;

    public JobUnlock(Job job, User worker) {
        this.job = job;
        this.worker = worker;
    }
}
