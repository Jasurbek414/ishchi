package uz.ishchi.app.worker;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.common.WorkPreference;
import uz.ishchi.app.common.dto.PageResponse;
import uz.ishchi.app.worker.dto.WorkerResponse;

@RestController
@RequestMapping("/api/workers")
@RequiredArgsConstructor
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
            Pageable pageable
    ) {
        return PageResponse.of(workerService.search(regionId, districtId, professionId, minExperience, search, workPreference, pageable));
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
