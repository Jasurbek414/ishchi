package uz.ishchi.app.telegram.dto;

import jakarta.validation.constraints.NotNull;

public record ResolvedRequest(@NotNull Boolean resolved) {
}
