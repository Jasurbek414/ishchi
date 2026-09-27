package uz.ishchi.app.worker;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.WorkPreference;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.worker.dto.WorkerResponse;

/**
 * Browsing workers is an employer activity, so it is restricted to that role. It used to be open
 * to any authenticated account, which meant a worker account could page through every other
 * worker's record.
 */
@RestController
@RequestMapping("/api/workers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('EMPLOYER')")
public class WorkerController {

    private final WorkerService workerService;

    @GetMapping
    public PageResponse<WorkerResponse> search(
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long professionId,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) WorkPreference workPreference,
            @RequestParam(required = false) Boolean availableToday,
            Pageable pageable
    ) {
        return PageResponse.of(workerService.search(regionId, districtId, professionId, minExperience, search, workPreference, availableToday, pageable));
    }

    @GetMapping("/map")
    public java.util.List<WorkerResponse> mapSearch(@RequestParam(required = false) Long regionId,
                                                      @RequestParam(required = false) Long professionId) {
        return workerService.mapSearch(regionId, professionId);
    }

    @GetMapping("/{id}")
    public WorkerResponse getById(@PathVariable Long id) {
        return workerService.getById(id);
    }
}
