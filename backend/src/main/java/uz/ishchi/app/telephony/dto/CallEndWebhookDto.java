package uz.ishchi.app.telephony.dto;

import jakarta.validation.constraints.NotBlank;

public record CallEndWebhookDto(
        @NotBlank(message = "callId bo'sh bo'lmasligi kerak")
        String callId,

        String status, // ANSWERED, NO ANSWER, BUSY, FAILED
        Integer durationSeconds,
        Integer billableSeconds,
        String recordingUrl,
        String notes
) {
}
