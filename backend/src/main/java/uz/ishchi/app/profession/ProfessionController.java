package uz.ishchi.app.profession;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import uz.ishchi.app.profession.dto.ProfessionResponse;

import java.util.List;

@RestController
@RequestMapping("/api/professions")
@RequiredArgsConstructor
public class ProfessionController {

    private final ProfessionRepository professionRepository;

    @GetMapping
    public List<ProfessionResponse> getActiveProfessions() {
        return professionRepository.findByActiveTrueOrderByCategoryAscNameAsc().stream()
                .map(ProfessionResponse::from)
                .toList();
    }
}
