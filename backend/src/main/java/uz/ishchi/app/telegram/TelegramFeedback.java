package uz.ishchi.app.telegram;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import uz.ishchi.app.user.User;

import java.time.Instant;

@Entity
@Table(name = "telegram_feedback")
@Getter
@Setter
@NoArgsConstructor
public class TelegramFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id", nullable = false)
    private Long chatId;

    /** Null when the sender hasn't linked their Telegram account to an app account yet. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(nullable = false)
    private boolean resolved = false;

    @Column(name = "admin_reply", columnDefinition = "text")
    private String adminReply;

    @Column(name = "replied_at")
    private Instant repliedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public TelegramFeedback(Long chatId, User user, String message) {
        this.chatId = chatId;
        this.user = user;
        this.message = message;
    }
}
