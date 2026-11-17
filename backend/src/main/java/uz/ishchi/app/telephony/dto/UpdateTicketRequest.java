package uz.ishchi.app.telephony.dto;

import uz.ishchi.app.telephony.TicketStatus;
import uz.ishchi.app.telephony.TicketUrgency;

import java.math.BigDecimal;

public record UpdateTicketRequest(
        String customerName,
        Long regionId,
        Long districtId,
        String addressLine,
        Double latitude,
        Double longitude,
        String category,
        String problemDescription,
        TicketUrgency urgency,
        TicketStatus status,
        Long assignedWorkerId,
        BigDecimal priceAgreed,
        String paymentType,
        String notes,
        String cancellationReason
) {
}
