package uz.ishchi.app.employer;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.employer.dto.EmployerMapResponse;
import uz.ishchi.app.profile.EmployerProfileRepository;

import java.util.List;

@RestController
@RequestMapping("/api/employers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('WORKER')")
public class EmployerMapController {

    private final EmployerProfileRepository employerProfileRepository;

    @GetMapping("/map")
    @Transactional(readOnly = true)
    public List<EmployerMapResponse> mapSearch(@RequestParam(required = false) Long regionId,
                                               @RequestParam(required = false) Double latitude,
                                               @RequestParam(required = false) Double longitude,
                                               @RequestParam(required = false) Double radiusDegrees) {
        // Without a viewport the box is the whole globe, which is what the map asked for before.
        boolean box = latitude != null && longitude != null && radiusDegrees != null && radiusDegrees > 0;
        double r = box ? radiusDegrees : 0;
        return employerProfileRepository.findForMap(regionId,
                        box ? latitude - r : -90, box ? latitude + r : 90,
                        box ? longitude - r : -180, box ? longitude + r : 180,
                        PageRequest.of(0, 500)).stream()
                .map(EmployerMapResponse::from)
                .toList();
    }
}
