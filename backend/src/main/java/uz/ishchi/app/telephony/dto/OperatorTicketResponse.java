package uz.ishchi.app.telephony.dto;

import uz.ishchi.app.telephony.OperatorTicket;
import uz.ishchi.app.telephony.TicketStatus;
import uz.ishchi.app.telephony.TicketUrgency;

import java.math.BigDecimal;
import java.time.Instant;

public record OperatorTicketResponse(
        Long id,
        String ticketNumber,
        Long callId,
        String customerPhone,
        String customerName,
        Long customerUserId,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        String addressLine,
        Double latitude,
        Double longitude,
        String category,
        String problemDescription,
        TicketUrgency urgency,
        TicketStatus status,
        Long operatorId,
        String operatorName,
        Long assignedWorkerId,
        String assignedWorkerName,
        String assignedWorkerPhone,
        BigDecimal priceAgreed,
        String paymentType,
        String notes,
        String cancellationReason,
        Instant createdAt,
        Instant assignedAt,
        Instant completedAt,
        Instant updatedAt
) {
    public static OperatorTicketResponse from(OperatorTicket t) {
        String opName = null;
        if (t.getOperator() != null) {
            opName = t.getOperator().getPhone();
        }

        String workerName = null;
        String workerPhone = null;
        if (t.getAssignedWorker() != null) {
            workerName = t.getAssignedWorker().getFirstName() + (t.getAssignedWorker().getLastName() != null ? " " + t.getAssignedWorker().getLastName() : "");
            if (t.getAssignedWorker().getUser() != null) {
                workerPhone = t.getAssignedWorker().getUser().getPhone();
            }
        }

        return new OperatorTicketResponse(
                t.getId(),
                t.getTicketNumber(),
                t.getCall() != null ? t.getCall().getId() : null,
                t.getCustomerPhone(),
                t.getCustomerName(),
                t.getCustomerUser() != null ? t.getCustomerUser().getId() : null,
                t.getRegion() != null ? t.getRegion().getId() : null,
                t.getRegion() != null ? t.getRegion().getName() : null,
                t.getDistrict() != null ? t.getDistrict().getId() : null,
                t.getDistrict() != null ? t.getDistrict().getName() : null,
                t.getAddressLine(),
                t.getLatitude(),
                t.getLongitude(),
                t.getCategory(),
                t.getProblemDescription(),
                t.getUrgency(),
                t.getStatus(),
                t.getOperator() != null ? t.getOperator().getId() : null,
                opName,
                t.getAssignedWorker() != null ? t.getAssignedWorker().getId() : null,
                workerName,
                workerPhone,
                t.getPriceAgreed(),
                t.getPaymentType(),
                t.getNotes(),
                t.getCancellationReason(),
                t.getCreatedAt(),
                t.getAssignedAt(),
                t.getCompletedAt(),
                t.getUpdatedAt()
        );
    }
}
