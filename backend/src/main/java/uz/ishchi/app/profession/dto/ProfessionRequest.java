package uz.ishchi.app.profession.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfessionRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String category
) {
}
