package uz.ishchi.app.search.dto;

import uz.ishchi.app.common.JobType;
import uz.ishchi.app.search.SavedSearch;

import java.math.BigDecimal;

public record SavedSearchResponse(
        Long id,
        String name,
        Long professionId,
        String professionName,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        JobType jobType,
        BigDecimal minPayment,
        boolean notifyEnabled
) {
    public static SavedSearchResponse from(SavedSearch s) {
        return new SavedSearchResponse(
                s.getId(),
                s.getName(),
                s.getProfession() == null ? null : s.getProfession().getId(),
                s.getProfession() == null ? null : s.getProfession().getName(),
                s.getRegion() == null ? null : s.getRegion().getId(),
                s.getRegion() == null ? null : s.getRegion().getName(),
                s.getDistrict() == null ? null : s.getDistrict().getId(),
                s.getDistrict() == null ? null : s.getDistrict().getName(),
                s.getJobType(),
                s.getMinPayment(),
                s.isNotify()
        );
    }
}
