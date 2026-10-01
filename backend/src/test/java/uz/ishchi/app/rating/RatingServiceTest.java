package uz.ishchi.app.rating;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import uz.ishchi.app.common.ApplicationStatus;
import uz.ishchi.app.common.JobStatus;
import uz.ishchi.app.common.Role;
import uz.ishchi.app.common.exception.ApiException;
import uz.ishchi.app.job.Job;
import uz.ishchi.app.job.JobApplicationRepository;
import uz.ishchi.app.job.JobRepository;
import uz.ishchi.app.profile.EmployerProfile;
import uz.ishchi.app.profile.EmployerProfileRepository;
import uz.ishchi.app.profile.WorkerProfile;
import uz.ishchi.app.profile.WorkerProfileRepository;
import uz.ishchi.app.rating.dto.RatingRequest;
import uz.ishchi.app.user.User;
import uz.ishchi.app.user.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * A rating has to be earned: the pair must have worked together on the job being rated. Without that
 * gate a score would mean nothing, since anybody who merely read a posting could leave one.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RatingServiceTest {

    @Mock private RatingRepository ratingRepository;
    @Mock private JobRepository jobRepository;
    @Mock private JobApplicationRepository applicationRepository;
    @Mock private UserRepository userRepository;
    @Mock private WorkerProfileRepository workerProfileRepository;
    @Mock private EmployerProfileRepository employerProfileRepository;
    @InjectMocks private RatingService ratingService;

    private User employerUser;
    private User workerUser;
    private User bystander;
    private Job job;

    @BeforeEach
    void setUp() {
        employerUser = user(1L, Role.EMPLOYER, "+998901111111");
        workerUser = user(2L, Role.WORKER, "+998902222222");
        bystander = user(3L, Role.WORKER, "+998903333333");

        EmployerProfile employer = new EmployerProfile();
        employer.setUser(employerUser);
        job = new Job();
        ReflectionTestUtils.setField(job, "id", 10L);
        job.setEmployer(employer);
        job.setTitle("Kafel yotqizish");
        job.setStatus(JobStatus.COMPLETED);

        when(jobRepository.findById(10L)).thenReturn(Optional.of(job));
        when(userRepository.findById(2L)).thenReturn(Optional.of(workerUser));
        when(userRepository.findById(3L)).thenReturn(Optional.of(bystander));
        when(ratingRepository.save(any(Rating.class))).thenAnswer(inv -> inv.getArgument(0));
        when(ratingRepository.aggregateFor(any())).thenReturn(new Object[]{4.5d, 2L});
        when(workerProfileRepository.findByUserId(any())).thenReturn(Optional.empty());
        when(employerProfileRepository.findByUserId(any())).thenReturn(Optional.empty());
    }

    private User user(long id, Role role, String phone) {
        User u = new User(phone, "hash", role);
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    @Test
    void theEmployerCanRateTheWorkerTheyHired() {
        when(applicationRepository.existsByJobIdAndWorkerIdAndStatus(10L, 2L, ApplicationStatus.HIRED))
                .thenReturn(true);

        var response = ratingService.rate(employerUser, new RatingRequest(10L, 2L, 5, "Yaxshi ishladi"));

        assertThat(response.score()).isEqualTo(5);
        assertThat(response.jobTitle()).isEqualTo("Kafel yotqizish");
    }

    @Test
    void aWorkerWhoWasNeverHiredCannotBeRated() {
        when(applicationRepository.existsByJobIdAndWorkerIdAndStatus(10L, 2L, ApplicationStatus.HIRED))
                .thenReturn(false);

        assertThatThrownBy(() -> ratingService.rate(employerUser, new RatingRequest(10L, 2L, 5, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("birga ishlaganingiz qayd etilmagan");
        verify(ratingRepository, never()).save(any());
    }

    @Test
    void someoneWhoWasNotInvolvedCannotRate() {
        assertThatThrownBy(() -> ratingService.rate(bystander, new RatingRequest(10L, 2L, 1, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("qatnashmagansiz");
    }

    @Test
    void ratingIsOnlyPossibleOnceTheJobIsFinished() {
        job.setStatus(JobStatus.ACTIVE);

        assertThatThrownBy(() -> ratingService.rate(employerUser, new RatingRequest(10L, 2L, 5, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("yakunlangan");
    }

    @Test
    void theSamePairCannotRateTwiceForOneJob() {
        when(applicationRepository.existsByJobIdAndWorkerIdAndStatus(10L, 2L, ApplicationStatus.HIRED))
                .thenReturn(true);
        when(ratingRepository.existsByJobIdAndRaterIdAndRateeId(10L, 1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> ratingService.rate(employerUser, new RatingRequest(10L, 2L, 5, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("allaqachon qoldirilgan");
    }

    @Test
    void nobodyCanRateThemselves() {
        assertThatThrownBy(() -> ratingService.rate(employerUser, new RatingRequest(10L, 1L, 5, null)))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("O'zingizga");
    }

    @Test
    void theAverageIsMirroredOntoWhicheverProfilesTheAccountHas() {
        when(applicationRepository.existsByJobIdAndWorkerIdAndStatus(10L, 2L, ApplicationStatus.HIRED))
                .thenReturn(true);
        WorkerProfile workerProfile = new WorkerProfile();
        when(workerProfileRepository.findByUserId(2L)).thenReturn(Optional.of(workerProfile));

        ratingService.rate(employerUser, new RatingRequest(10L, 2L, 4, null));

        assertThat(workerProfile.getRatingAverage()).isEqualTo(4.5);
        assertThat(workerProfile.getRatingCount()).isEqualTo(2);
    }
}
