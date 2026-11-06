package uz.ishchi.app.tma.dto;

public record TmaSendOtpResponse(
        boolean existingUser,
        String message
) {}
