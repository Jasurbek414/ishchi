package uz.ishchi.app.landing.dto;

import jakarta.validation.constraints.Size;

/** Every field optional — partial update, same pattern as AppSettingsUpdateRequest.
 *  Size limits mirror the landing_content column widths (V16 migration). */
public record LandingContentUpdateRequest(
        @Size(max = 300) String heroTitle,
        @Size(max = 600) String heroSubtitle,
        @Size(max = 40) String stat1Value,
        @Size(max = 100) String stat1Label,
        @Size(max = 40) String stat2Value,
        @Size(max = 100) String stat2Label,
        @Size(max = 40) String stat3Value,
        @Size(max = 100) String stat3Label,
        @Size(max = 40) String stat4Value,
        @Size(max = 100) String stat4Label
) {
}
