package uz.ishchi.app.telegram;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TelegramAwaitingFeedbackRepository extends JpaRepository<TelegramAwaitingFeedback, Long> {
}
