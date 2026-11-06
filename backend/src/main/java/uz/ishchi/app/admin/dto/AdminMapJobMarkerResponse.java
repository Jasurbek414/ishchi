package uz.ishchi.app.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminMapJobMarkerResponse(
        Long id,
        String title,
        Double latitude,
        Double longitude,
        BigDecimal payment,
        String paymentType,
        String jobType,
        String status,
        boolean urgent,
        String professionName,
        String employerName,
        String employerPhone,
        String regionName,
        String districtName,
        Instant createdAt
) {
}
