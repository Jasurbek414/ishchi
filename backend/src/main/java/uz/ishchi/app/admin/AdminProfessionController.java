package uz.ishchi.app.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import uz.ishchi.app.admin.dto.ActiveRequest;
import uz.ishchi.app.profession.ProfessionRepository;
import uz.ishchi.app.profession.ProfessionService;
import uz.ishchi.app.profession.dto.ProfessionRequest;
import uz.ishchi.app.profession.dto.ProfessionResponse;

import java.util.List;

@RestController
@RequestMapping("/api/admin/professions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminProfessionController {

    private final ProfessionService professionService;
    private final ProfessionRepository professionRepository;

    @GetMapping
    public List<ProfessionResponse> getAll() {
        return professionRepository.findAllByOrderByCategoryAscNameAsc().stream()
                .map(ProfessionResponse::from)
                .toList();
    }

    @PostMapping
    public ProfessionResponse create(@Valid @RequestBody ProfessionRequest request) {
        return ProfessionResponse.from(professionService.create(request));
    }

    @PatchMapping("/{id}")
    public ProfessionResponse update(@PathVariable Long id, @Valid @RequestBody ProfessionRequest request) {
        return ProfessionResponse.from(professionService.update(id, request));
    }

    @PatchMapping("/{id}/active")
    public void setActive(@PathVariable Long id, @Valid @RequestBody ActiveRequest request) {
        professionService.setActive(id, request.active());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        professionService.delete(id);
    }
}
