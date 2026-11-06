package uz.ishchi.app.tma.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record TmaJobDto(
        Long id,
        String title,
        String description,
        BigDecimal payment,
        String paymentType,
        Long professionId,
        String professionName,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        String contactPhone,
        String employerName,
        Instant createdAt,
        String status,
        boolean urgent
) {
}
