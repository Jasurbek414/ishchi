package uz.ishchi.app.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminDistrictRequest(
        @NotBlank(message = "Tuman nomi kiritilishi shart")
        @Size(max = 100, message = "Tuman nomi 100 belgidan oshmasligi kerak")
        String name
) {
}
