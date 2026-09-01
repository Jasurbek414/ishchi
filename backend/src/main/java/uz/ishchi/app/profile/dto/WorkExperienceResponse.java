package uz.ishchi.app.profile.dto;

import uz.ishchi.app.profile.WorkExperience;

import java.time.LocalDate;

public record WorkExperienceResponse(
        Long id,
        String companyName,
        String positionTitle,
        String description,
        LocalDate startDate,
        LocalDate endDate
) {
    public static WorkExperienceResponse from(WorkExperience e) {
        return new WorkExperienceResponse(
                e.getId(), e.getCompanyName(), e.getPositionTitle(), e.getDescription(), e.getStartDate(), e.getEndDate()
        );
    }
}
