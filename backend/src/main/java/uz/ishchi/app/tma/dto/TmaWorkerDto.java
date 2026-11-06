package uz.ishchi.app.tma.dto;

import java.util.List;

public record TmaWorkerDto(
        Long id,
        String fullName,
        String avatarUrl,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        Integer experienceYears,
        Double ratingAverage,
        int ratingCount,
        boolean available,
        boolean verified,
        String phone,
        List<String> professions,
        String about
) {
}
