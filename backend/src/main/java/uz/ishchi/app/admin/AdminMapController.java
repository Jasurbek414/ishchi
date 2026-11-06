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
@PreAuthorize("hasRole('ADMIN')")
public class AdminMapController {

    private final AdminMapService adminMapService;

    @GetMapping("/stats")
    public AdminMapStatsResponse getStats() {
        return adminMapService.getStats();
    }

    @GetMapping("/regions")
    public List<AdminRegionDetailResponse> getRegions() {
        return adminMapService.getRegions();
    }

    @PutMapping("/regions/{id}")
    public AdminRegionDetailResponse updateRegion(
            @PathVariable Long id,
            @Valid @RequestBody AdminRegionUpdateRequest request) {
        return adminMapService.updateRegion(id, request);
    }

    @GetMapping("/jobs")
    public List<AdminMapJobMarkerResponse> getMapJobs() {
        return adminMapService.getMapJobs();
    }

    @PostMapping("/regions/{regionId}/districts")
    @ResponseStatus(HttpStatus.CREATED)
    public DistrictResponse addDistrict(
            @PathVariable Long regionId,
            @Valid @RequestBody AdminDistrictRequest request) {
        return adminMapService.addDistrict(regionId, request);
    }

    @PutMapping("/districts/{districtId}")
    public DistrictResponse updateDistrict(
            @PathVariable Long districtId,
            @Valid @RequestBody AdminDistrictRequest request) {
        return adminMapService.updateDistrict(districtId, request);
    }

    @DeleteMapping("/districts/{districtId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDistrict(@PathVariable Long districtId) {
        adminMapService.deleteDistrict(districtId);
    }
}
