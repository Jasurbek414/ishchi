package uz.ishchi.app.telegram;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** Marks a chat as having just tapped "feedback" — its next free-text message should be
 *  captured as feedback rather than matched against the menu buttons. Persisted (not
 *  in-memory) so a backend restart mid-conversation doesn't silently drop it. */
@Entity
@Table(name = "telegram_awaiting_feedback")
@Getter
@Setter
@NoArgsConstructor
public class TelegramAwaitingFeedback {

    @Id
    @Column(name = "chat_id")
    private Long chatId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public TelegramAwaitingFeedback(Long chatId) {
        this.chatId = chatId;
    }
}
