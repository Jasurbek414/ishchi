package uz.ishchi.app.location;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.location.dto.DistrictResponse;
import uz.ishchi.app.location.dto.RegionResponse;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class LocationController {

    private final RegionRepository regionRepository;
    private final DistrictRepository districtRepository;

    @GetMapping
    public List<RegionResponse> getRegions() {
        return regionRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(RegionResponse::from)
                .toList();
    }

    @GetMapping("/{id}/districts")
    public List<DistrictResponse> getDistricts(@PathVariable Long id) {
        return districtRepository.findByRegionIdOrderByNameAsc(id).stream()
                .map(DistrictResponse::from)
                .toList();
    }
}
