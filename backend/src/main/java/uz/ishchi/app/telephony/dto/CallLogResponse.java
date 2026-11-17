package uz.ishchi.app.telephony.dto;

import uz.ishchi.app.telephony.CallDirection;
import uz.ishchi.app.telephony.CallLog;
import uz.ishchi.app.telephony.CallStatus;

import java.time.Instant;

public record CallLogResponse(
        Long id,
        String callId,
        String callerPhone,
        String destinationNumber,
        CallDirection direction,
        CallStatus status,
        Long operatorId,
        String operatorPhone,
        Instant startTime,
        Instant answerTime,
        Instant endTime,
        Integer durationSeconds,
        String recordingUrl,
        String notes,
        Instant createdAt
) {
    public static CallLogResponse from(CallLog c) {
        return new CallLogResponse(
                c.getId(),
                c.getCallId(),
                c.getCallerPhone(),
                c.getDestinationNumber(),
                c.getDirection(),
                c.getStatus(),
                c.getOperator() != null ? c.getOperator().getId() : null,
                c.getOperator() != null ? c.getOperator().getPhone() : null,
                c.getStartTime(),
                c.getAnswerTime(),
                c.getEndTime(),
                c.getDurationSeconds(),
                c.getRecordingUrl(),
                c.getNotes(),
                c.getCreatedAt()
        );
    }
}
