package uz.ishchi.app.telephony.dto;

import jakarta.validation.constraints.NotBlank;

public record IncomingCallWebhookDto(
        @NotBlank(message = "callId bo'sh bo'lmasligi kerak")
        String callId,

        @NotBlank(message = "callerPhone bo'sh bo'lmasligi kerak")
        String callerPhone,

        String destinationNumber,
        String direction,
        String operatorExtension
) {
}
