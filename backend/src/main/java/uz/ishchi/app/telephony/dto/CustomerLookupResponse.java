package uz.ishchi.app.telephony.dto;

import java.util.List;

public record CustomerLookupResponse(
        String phone,
        boolean exists,
        Long userId,
        String fullName,
        String role,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        List<OperatorTicketResponse> previousTickets
) {
}
