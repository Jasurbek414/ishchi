package uz.ishchi.app.telegram.dto;

import uz.ishchi.app.telegram.TelegramFeedback;

import java.time.Instant;

public record TelegramFeedbackResponse(
        Long id,
        Long userId,
        String userPhone,
        String userName,
        Long chatId,
        String message,
        boolean resolved,
        String adminReply,
        Instant repliedAt,
        Instant createdAt
) {
    public static TelegramFeedbackResponse from(TelegramFeedback f, String userName) {
        return new TelegramFeedbackResponse(
                f.getId(),
                f.getUser() != null ? f.getUser().getId() : null,
                f.getUser() != null ? f.getUser().getPhone() : null,
                userName,
                f.getChatId(),
                f.getMessage(),
                f.isResolved(),
                f.getAdminReply(),
                f.getRepliedAt(),
                f.getCreatedAt()
        );
    }
}
