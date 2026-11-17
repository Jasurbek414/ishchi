package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.admin.dto.*;
import uz.ishchi.app.location.dto.DistrictResponse;

import java.util.List;

@RestController
@RequestMapping("/api/admin/map")
@RequiredArgsConstructor
public class AdminMapController {

    private final AdminMapService adminMapService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public AdminMapStatsResponse getStats() {
        return adminMapService.getStats();
    }

    @GetMapping("/regions")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public List<AdminRegionDetailResponse> getRegions() {
        return adminMapService.getRegions();
    }

    @PutMapping("/regions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminRegionDetailResponse updateRegion(
            @PathVariable Long id,
            @Valid @RequestBody AdminRegionUpdateRequest request) {
        return adminMapService.updateRegion(id, request);
    }

    @GetMapping("/jobs")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    public List<AdminMapJobMarkerResponse> getMapJobs() {
        return adminMapService.getMapJobs();
    }

    @PostMapping("/regions/{regionId}/districts")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public DistrictResponse addDistrict(
            @PathVariable Long regionId,
            @Valid @RequestBody AdminDistrictRequest request) {
        return adminMapService.addDistrict(regionId, request);
    }

    @PutMapping("/districts/{districtId}")
    @PreAuthorize("hasRole('ADMIN')")
    public DistrictResponse updateDistrict(
            @PathVariable Long districtId,
            @Valid @RequestBody AdminDistrictRequest request) {
        return adminMapService.updateDistrict(districtId, request);
    }

    @DeleteMapping("/districts/{districtId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteDistrict(@PathVariable Long districtId) {
        adminMapService.deleteDistrict(districtId);
    }
}
