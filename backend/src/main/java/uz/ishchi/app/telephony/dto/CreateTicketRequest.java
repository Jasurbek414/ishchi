package uz.ishchi.app.telephony.dto;

import jakarta.validation.constraints.NotBlank;
import uz.ishchi.app.telephony.TicketUrgency;

import java.math.BigDecimal;

public record CreateTicketRequest(
        String callId,

        @NotBlank(message = "Mijoz telefon raqami kiritilishi shart")
        String customerPhone,

        String customerName,
        Long customerUserId,
        Long regionId,
        Long districtId,
        String addressLine,
        Double latitude,
        Double longitude,

        @NotBlank(message = "Kategoriya kiritilishi shart")
        String category,

        @NotBlank(message = "Muammo tavsifi kiritilishi shart")
        String problemDescription,

        TicketUrgency urgency,
        Long assignedWorkerId,
        BigDecimal priceAgreed,
        String paymentType,
        String notes
) {
}
