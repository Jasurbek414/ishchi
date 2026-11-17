package uz.ishchi.app.telephony.dto;

import jakarta.validation.constraints.NotBlank;

public record InitiateCallRequest(
        @NotBlank(message = "Telefon raqami kiritilishi shart")
        String phone,
        Long ticketId
) {
}
