package uz.ishchi.app.search;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import uz.ishchi.app.common.JobType;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.location.District;
import uz.ishchi.app.location.Region;
import uz.ishchi.app.profession.Profession;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/** An empty saved search matches everything; each field set narrows it. */
class SavedSearchMatchingTest {

    private Job job;
    private Profession plasterer;
    private Region namangan;
    private District chust;

    @BeforeEach
    void setUp() {
        plasterer = withId(new Profession(), 1L);
        plasterer.setName("Suvoqchi");
        namangan = withId(new Region(), 2L);
        chust = withId(new District(), 3L);

        job = new Job();
        job.setProfession(plasterer);
        job.setRegion(namangan);
        job.setDistrict(chust);
        job.setJobType(JobType.DAILY);
        job.setPayment(new BigDecimal("300000"));
    }

    private <T> T withId(T entity, Long id) {
        ReflectionTestUtils.setField(entity, "id", id);
        return entity;
    }

    private SavedSearch search() {
        return new SavedSearch();
    }

    @Test
    void anEmptySearchFollowsEverything() {
        assertThat(search().matches(job)).isTrue();
    }

    @Test
    void professionMustAgree() {
        SavedSearch s = search();
        s.setProfession(plasterer);
        assertThat(s.matches(job)).isTrue();

        s.setProfession(withId(new Profession(), 99L));
        assertThat(s.matches(job)).isFalse();
    }

    @Test
    void regionAndDistrictMustAgree() {
        SavedSearch s = search();
        s.setRegion(namangan);
        s.setDistrict(chust);
        assertThat(s.matches(job)).isTrue();

        s.setDistrict(withId(new District(), 99L));
        assertThat(s.matches(job)).isFalse();
    }

    @Test
    void jobTypeMustAgree() {
        SavedSearch s = search();
        s.setJobType(JobType.DAILY);
        assertThat(s.matches(job)).isTrue();

        s.setJobType(JobType.PERMANENT);
        assertThat(s.matches(job)).isFalse();
    }

    @Test
    void payBelowTheFloorIsNotWorthTelling() {
        SavedSearch s = search();
        s.setMinPayment(new BigDecimal("250000"));
        assertThat(s.matches(job)).isTrue();

        s.setMinPayment(new BigDecimal("400000"));
        assertThat(s.matches(job)).isFalse();
    }
}
