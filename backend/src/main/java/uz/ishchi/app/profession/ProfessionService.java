package uz.ishchi.app.profession;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.profession.dto.ProfessionRequest;

@Service
@RequiredArgsConstructor
public class ProfessionService {

    private final ProfessionRepository professionRepository;

    @Transactional
    public Profession create(ProfessionRequest request) {
        if (professionRepository.existsByNameIgnoreCase(request.name())) {
            throw ApiException.conflict("Bu nomdagi kasb allaqachon mavjud");
        }
        Profession profession = new Profession();
        profession.setName(request.name());
        profession.setCategory(request.category());
        profession.setActive(true);
        return professionRepository.save(profession);
    }

    @Transactional
    public Profession update(Long id, ProfessionRequest request) {
        Profession profession = professionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Kasb topilmadi"));
        profession.setName(request.name());
        profession.setCategory(request.category());
        return profession;
    }

    @Transactional
    public void setActive(Long id, boolean active) {
        Profession profession = professionRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Kasb topilmadi"));
        profession.setActive(active);
    }

    @Transactional
    public void delete(Long id) {
        if (!professionRepository.existsById(id)) {
            throw ApiException.notFound("Kasb topilmadi");
        }
        professionRepository.deleteById(id);
    }
}
