package uz.ishchi.app.tma.dto;

import uz.ishchi.app.common.Role;

import java.util.List;

public record TmaRegisterRequest(
        Role role,
        String phone,
        String firstName,
        String lastName,
        Long regionId,
        Long districtId,
        List<Long> professionIds,
        Integer experienceYears,
        String about
) {}
