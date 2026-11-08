package uz.ishchi.app.emergency.dto;

public record ContractApplicationRequest(
        String fullName,
        String phone,
        String category,
        String passportData,
        Integer experienceYears,
        String description,
        String telegramUsername,
        boolean agreedToTerms
) {}
