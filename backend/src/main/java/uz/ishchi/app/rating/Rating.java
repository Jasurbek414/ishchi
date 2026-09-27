package uz.ishchi.app.rating;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.user.User;

import java.time.Instant;

/**
 * One person's score for the other after a job they actually did together.
 *
 * <p>Always anchored to a job so it cannot be left by someone who was never involved — the
 * application record for that job is what proves the two were in contact.
 */
@Entity
@Table(name = "ratings", uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "rater_id", "ratee_id"}))
@Getter
@Setter
@NoArgsConstructor
public class Rating {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rater_id", nullable = false)
    private User rater;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ratee_id", nullable = false)
    private User ratee;

    @Column(nullable = false)
    private short score;

    @Column(length = 500)
    private String comment;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public Rating(Job job, User rater, User ratee, short score, String comment) {
        this.job = job;
        this.rater = rater;
        this.ratee = ratee;
        this.score = score;
        this.comment = comment;
    }
}
