package uz.ishchi.app.tma.dto;

import uz.ishchi.app.location.dto.RegionResponse;
import uz.ishchi.app.profession.dto.ProfessionResponse;

import java.util.List;

public record TmaBootstrapResponse(
        List<ProfessionResponse> professions,
        List<RegionResponse> regions,
        long totalWorkers,
        long totalJobs,
        String botUsername,
        String appDownloadUrl,
        String playStoreUrl
) {
}
