package uz.ishchi.app.tma.dto;

import uz.ishchi.app.common.Role;

import java.util.List;

public record TmaProfileDto(
        Long userId,
        String phone,
        Role role,
        Long telegramChatId,
        String firstName,
        String lastName,
        String fullName,
        String avatarUrl,
        String about,
        Long regionId,
        String regionName,
        Long districtId,
        String districtName,
        List<Long> professionIds,
        List<String> professionNames,
        Integer experienceYears,
        Boolean available,
        Double ratingAverage,
        int ratingCount,
        boolean hasWorkerProfile,
        boolean hasEmployerProfile
) {}
