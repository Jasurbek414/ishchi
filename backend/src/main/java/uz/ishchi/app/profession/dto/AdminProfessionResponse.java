package uz.ishchi.app.profession.dto;

import uz.ishchi.app.profession.Profession;

public record AdminProfessionResponse(Long id, String name, String category, boolean active, long jobCount) {
    public static AdminProfessionResponse from(Profession p, long jobCount) {
        return new AdminProfessionResponse(p.getId(), p.getName(), p.getCategory(), p.isActive(), jobCount);
    }
}
