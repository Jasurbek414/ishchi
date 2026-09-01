package uz.ishchi.app.auth.dto;

/**
 * {@code telegramLinkUrl} is non-null only when the user must first open the Telegram bot
 * before a code can be delivered — the client should show a "open Telegram" screen and poll
 * {@code GET /api/auth/telegram-link-status} instead of jumping straight to OTP entry.
 */
public record OtpDispatchResponse(String message, String telegramLinkUrl) {
}
