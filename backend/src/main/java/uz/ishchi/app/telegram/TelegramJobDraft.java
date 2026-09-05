package uz.ishchi.app.telegram;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.common.PaymentType;
import uz.ishchi.app.common.TelegramDraftStep;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.profession.Profession;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** One in-progress "post a job via Telegram" wizard per chat. Persisted (not in-memory)
 *  so a backend restart mid-conversation doesn't silently drop it — the same lesson
 *  learned from the feedback-capture flow. */
@Entity
@Table(name = "telegram_job_draft")
@Getter
@Setter
@NoArgsConstructor
public class TelegramJobDraft {

    @Id
    @Column(name = "chat_id")
    private Long chatId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TelegramDraftStep step;

    @Column(length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profession_id")
    private Profession profession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_id")
    private Region region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id")
    private District district;

    @Column(precision = 14, scale = 2)
    private BigDecimal payment;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", length = 20)
    private PaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_type", length = 20)
    private JobType jobType;

    @Column(name = "workers_needed")
    private Integer workersNeeded;

    @ElementCollection
    @CollectionTable(name = "telegram_job_draft_images", joinColumns = @JoinColumn(name = "draft_chat_id"))
    @Column(name = "url")
    private List<String> imageUrls = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public TelegramJobDraft(Long chatId) {
        this.chatId = chatId;
        this.step = TelegramDraftStep.TITLE;
    }
}
