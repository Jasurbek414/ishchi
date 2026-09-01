package uz.ishchi.app.profession.dto;

import uz.ishchi.app.profession.Profession;

public record ProfessionResponse(Long id, String name, String category, boolean active) {
    public static ProfessionResponse from(Profession p) {
        return new ProfessionResponse(p.getId(), p.getName(), p.getCategory(), p.isActive());
    }
}
