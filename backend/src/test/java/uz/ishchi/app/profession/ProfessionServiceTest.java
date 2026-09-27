package uz.ishchi.app.profession;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.profession.dto.ProfessionRequest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProfessionServiceTest {

    @Mock private ProfessionRepository professionRepository;
    @Mock private JobRepository jobRepository;
    @InjectMocks private ProfessionService professionService;

    private Profession existing(String name) {
        Profession p = new Profession();
        p.setName(name);
        p.setCategory("Qurilish");
        return p;
    }

    @Test
    void refusesToRenameOntoAnExistingName() {
        // Only create() checked this, so a rename hit the unique constraint and came back as a
        // misleading "cannot be deleted" conflict.
        when(professionRepository.findById(1L)).thenReturn(Optional.of(existing("Duradgor")));
        when(professionRepository.existsByNameIgnoreCase("Suvoqchi")).thenReturn(true);

        assertThatThrownBy(() -> professionService.update(1L, new ProfessionRequest("Suvoqchi", "Qurilish")))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("allaqachon mavjud");
    }

    @Test
    void allowsSavingAProfessionUnderItsOwnName() {
        when(professionRepository.findById(1L)).thenReturn(Optional.of(existing("Duradgor")));
        when(professionRepository.existsByNameIgnoreCase("duradgor")).thenReturn(true);

        Profession updated = professionService.update(1L, new ProfessionRequest("duradgor", "Ta'mirlash"));

        assertThat(updated.getCategory()).isEqualTo("Ta'mirlash");
    }

    @Test
    void explainsWhyAProfessionInUseCannotBeDeleted() {
        when(professionRepository.existsById(1L)).thenReturn(true);
        when(jobRepository.countByProfessionId(1L)).thenReturn(4L);

        assertThatThrownBy(() -> professionService.delete(1L))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("4 ta buyurtmada");
        verify(professionRepository, never()).deleteById(1L);
    }

    @Test
    void deletesAProfessionNothingReferences() {
        when(professionRepository.existsById(1L)).thenReturn(true);
        when(jobRepository.countByProfessionId(1L)).thenReturn(0L);

        professionService.delete(1L);

        verify(professionRepository).deleteById(1L);
    }
}
