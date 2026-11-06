package uz.ishchi.app.tma.dto;

import java.math.BigDecimal;

public record TmaPostJobRequest(
        String title,
        String description,
        Long professionId,
        Long regionId,
        Long districtId,
        BigDecimal payment,
        String contactPhone,
        String employerName,
        String address,
        boolean urgent
) {
}
