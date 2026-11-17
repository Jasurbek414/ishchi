package uz.ishchi.app.telephony.dto;

public record HangupCallRequest(
        Integer durationSeconds,
        String notes
) {
}
