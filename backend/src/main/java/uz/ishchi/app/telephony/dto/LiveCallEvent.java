package uz.ishchi.app.telephony.dto;

import uz.ishchi.app.telephony.CallStatus;

import java.time.Instant;

public record LiveCallEvent(
        String eventType, // CALL_INCOMING, CALL_ANSWERED, CALL_ENDED
        String callId,
        String callerPhone,
        String customerName,
        Long customerId,
        CallStatus status,
        Instant timestamp
) {
}
