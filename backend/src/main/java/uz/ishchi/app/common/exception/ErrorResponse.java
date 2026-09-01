package uz.ishchi.app.common.exception;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors,
        String errorCode
) {
    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(Instant.now(), status, error, message, null, null);
    }

    public static ErrorResponse of(int status, String error, String message, Map<String, String> fieldErrors) {
        return new ErrorResponse(Instant.now(), status, error, message, fieldErrors, null);
    }

    public static ErrorResponse of(int status, String error, String message, String errorCode) {
        return new ErrorResponse(Instant.now(), status, error, message, null, errorCode);
    }
}
