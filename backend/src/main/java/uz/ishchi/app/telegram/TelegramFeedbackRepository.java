package uz.ishchi.app.telegram;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelegramFeedbackRepository extends JpaRepository<TelegramFeedback, Long> {

    Page<TelegramFeedback> findByResolved(boolean resolved, Pageable pageable);

    long countByResolvedFalse();
}
